<?php

use App\Services\BackupService;

beforeEach(function () {
    $this->backupTestDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'subul-backup-' . bin2hex(random_bytes(6));
    $this->backupTestDatabase = $this->backupTestDir . DIRECTORY_SEPARATOR . 'database.sqlite';
    mkdir($this->backupTestDir, 0777, true);

    $pdo = new PDO('sqlite:' . $this->backupTestDatabase);
    $pdo->exec('CREATE TABLE migrations (id INTEGER PRIMARY KEY, migration TEXT)');
    $pdo->exec('CREATE TABLE subul_options (id INTEGER PRIMARY KEY, name TEXT)');
    $pdo->exec("INSERT INTO subul_options (name) VALUES ('first')");
    $pdo = null;

    $this->backupTestConnection = config('database.default');
    $this->backupTestConfig = config('database.connections.' . $this->backupTestConnection);

    config([
        'database.default' => 'backup-scratch',
        'database.connections.backup-scratch' => [
            'driver' => 'sqlite',
            'database' => $this->backupTestDatabase,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ],
    ]);
});

afterEach(function () {
    config([
        'database.default' => $this->backupTestConnection,
        'database.connections.' . $this->backupTestConnection => $this->backupTestConfig,
        'database.connections.backup-scratch' => null,
    ]);

    foreach (glob($this->backupTestDir . DIRECTORY_SEPARATOR . '*') ?: [] as $file) {
        @unlink($file);
    }

    @rmdir($this->backupTestDir);
});

test('a snapshot passes verification and becomes the latest backup', function () {
    $backups = new BackupService;
    $directory = $this->backupTestDir . DIRECTORY_SEPARATOR . 'backups';

    $result = $backups->create(30, 30, $directory);

    expect($result['file'])->toBeFile();
    expect($result['size'])->toBeGreaterThan(0);
    expect($backups->verify($result['file']))->toBeTrue();
    expect($backups->latestVerified($directory)['file'])->toBe($result['file']);
});

test('retention removes expired snapshots and the oldest excess ones', function () {
    $backups = new BackupService;
    $directory = $this->backupTestDir . DIRECTORY_SEPARATOR . 'backups';
    mkdir($directory, 0777, true);

    $current = $directory . DIRECTORY_SEPARATOR . 'subul-current.sqlite';
    file_put_contents($current, 'current');
    touch($current, time());

    $expired = $directory . DIRECTORY_SEPARATOR . 'subul-expired.sqlite';
    file_put_contents($expired, 'expired');
    touch($expired, time() - 40 * 86400);

    for ($i = 1; $i <= 31; $i++) {
        $file = $directory . DIRECTORY_SEPARATOR . 'subul-fake-' . $i . '.sqlite';
        file_put_contents($file, 'fake');
        touch($file, time() - $i * 60);
    }

    $pruned = $backups->prune($directory, 30, 30, $current);

    expect($pruned)->toBe(3)
        ->and(file_exists($current))->toBeTrue()
        ->and(file_exists($expired))->toBeFalse()
        ->and(glob($directory . DIRECTORY_SEPARATOR . '*.sqlite'))->toHaveCount(30);
});

test('restoring a verified snapshot keeps the replaced database as a safety copy', function () {
    $backups = new BackupService;
    $directory = $this->backupTestDir . DIRECTORY_SEPARATOR . 'backups';
    $snapshot = $backups->create(30, 30, $directory);

    $pdo = new PDO('sqlite:' . $this->backupTestDatabase);
    $pdo->exec("INSERT INTO subul_options (name) VALUES ('second')");
    $pdo = null;

    $result = $backups->restore($snapshot['file'], $directory);

    $pdo = new PDO('sqlite:' . $this->backupTestDatabase);
    $count = (int) $pdo->query('SELECT COUNT(*) FROM subul_options')->fetchColumn();
    $pdo = null;

    expect($count)->toBe(1);
    expect($result['safety'])->toBeFile();
    expect($backups->verify($result['safety']))->toBeTrue();
});

test('a pre-restore safety copy is not offered as the latest backup', function () {
    $backups = new BackupService;
    $directory = $this->backupTestDir . DIRECTORY_SEPARATOR . 'backups';
    $snapshot = $backups->create(30, 30, $directory);

    $safety = $directory . DIRECTORY_SEPARATOR . 'pre-restore-test.sqlite';
    copy($snapshot['file'], $safety);
    touch($safety, time() + 5);

    expect($backups->latestVerified($directory)['file'])->toBe($snapshot['file']);
});

test('a snapshot outside the backup directory is rejected', function () {
    $backups = new BackupService;
    $directory = $this->backupTestDir . DIRECTORY_SEPARATOR . 'backups';
    mkdir($directory, 0777, true);

    expect(fn () => $backups->restore($this->backupTestDatabase, $directory))
        ->toThrow(RuntimeException::class);
});
