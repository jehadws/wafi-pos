<?php

use App\Http\Controllers\Dashboard\TransactionController;
use App\Http\Controllers\Dashboard\TransactionsAccountController;
use Illuminate\Support\Facades\Route;

Route::get('/accounting/transactions', [TransactionController::class, 'listTransactions'])->name(sb()->routeName('sb.dashboard.transactions'));
Route::get('/accounting/transactions/create', [TransactionController::class, 'createTransaction'])->name(sb()->routeName('sb.dashboard.transactions.create'));
Route::get('/accounting/transactions/edit/{transaction}', [TransactionController::class, 'editTransaction'])->name(sb()->routeName('sb.dashboard.transactions.edit'));
Route::get('/accounting/transactions/history/{transaction}', [TransactionController::class, 'getTransactionHistory'])->name(sb()->routeName('sb.dashboard.transactions.history'));
Route::get('/accounting/transactions/history', [TransactionController::class, 'transactionsHistory'])->name(sb()->routeName('sb.dashboard.cash-flow.history'));

Route::get('/accounting/accounts', [TransactionsAccountController::class, 'listTransactionsAccounts'])->name(sb()->routeName('sb.dashboard.transactions-account'));
Route::get('/accounting/accounts/create', [TransactionsAccountController::class, 'createTransactionsAccounts'])->name(sb()->routeName('sb.dashboard.transactions-account.create'));
Route::get('/accounting/accounts/edit/{account}', [TransactionsAccountController::class, 'editTransactionsAccounts'])->name(sb()->routeName('sb.dashboard.transactions-account.edit'));
Route::get('/accounting/rules', [TransactionsAccountController::class, 'listTransactionsRules'])->name(sb()->routeName('sb.dashboard.transactions-rules'));
