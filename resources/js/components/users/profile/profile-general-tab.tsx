import FormField from '@/components/forms/shared/form-field';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n';
import { Eye, Upload } from 'lucide-react';
import type { UserProfileFormData } from './types';

interface ProfileGeneralTabProps {
  form: {
    data: UserProfileFormData;
    errors: Partial<Record<keyof UserProfileFormData, string>>;
  };
  handleSelectChange: (name: keyof UserProfileFormData, value: string | number) => void;
}

export function ProfileGeneralTab({ form, handleSelectChange }: ProfileGeneralTabProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 pt-4 focus:outline-none">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Eye className="text-primary h-5 w-5" />
            {t('Appearance')}
          </CardTitle>
          <CardDescription>{t('Customize how your profile looks')}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 items-center gap-6 md:grid-cols-3">
          {/* Avatar */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('Profile Picture')}</Label>
            <div className="flex items-center gap-4">
              <Avatar className="border-primary-200 h-16 w-16 border-2">
                <AvatarImage src="/placeholder.svg?height=80&width=80" />
                <AvatarFallback className="text-lg">JD</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button type="button" variant="outline" size="sm" className="w-full gap-2">
                  <Upload className="h-4 w-4" />
                  {t('Upload New')}
                </Button>
                <p className="text-muted-foreground text-xs">{t('Recommended: Square JPG, PNG, or GIF, at least 200x200 pixels')}</p>
              </div>
            </div>
          </div>

          {/* Theme */}
          <FormField
            label={t('Theme')}
            description={t('Choose how the dashboard looks to you')}
            htmlFor="attribute_theme"
            error={form.errors.attribute_theme}
          >
            <Select value={form.data.attribute_theme} onValueChange={(value) => handleSelectChange('attribute_theme', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Select theme')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('Light')}</SelectItem>
                <SelectItem value="dark">{t('Dark')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {/* Language */}
          <FormField
            label={t('Language')}
            description={t('Choose your preferred language for the interface')}
            htmlFor="attribute_language"
            error={form.errors.attribute_language}
          >
            <Select value={form.data.attribute_language} onValueChange={(value) => handleSelectChange('attribute_language', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Select language')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('English')}</SelectItem>
                <SelectItem value="ar">{t('Arabic')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>
    </div>
  );
}
