from django.db import models


class BusinessSettings(models.Model):
    business_name = models.CharField(max_length=255, default='Tammo')
    logo = models.ImageField(upload_to='settings/', null=True, blank=True)
    business_email = models.EmailField(default='murshid10032004@gmail.com')
    business_phone = models.CharField(max_length=20, default='+91 70421 29273')
    business_address = models.TextField(default='Brij Vihar Double Storey Chandan Nagar Ghaziabad 201011')
    whatsapp_number = models.CharField(max_length=20, default='917042129273',
                                       help_text='Include country code, e.g. 917042129273')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Business Settings'
        verbose_name_plural = 'Business Settings'

    def __str__(self):
        return self.business_name

    @classmethod
    def get_settings(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        updated = False
        if obj.business_name != 'Tammo':
            obj.business_name = 'Tammo'
            updated = True
        if obj.business_email != 'murshid10032004@gmail.com':
            obj.business_email = 'murshid10032004@gmail.com'
            updated = True
        if obj.business_address != 'Brij Vihar Double Storey Chandan Nagar Ghaziabad 201011':
            obj.business_address = 'Brij Vihar Double Storey Chandan Nagar Ghaziabad 201011'
            updated = True
        if '98765' in str(obj.whatsapp_number) or '98765' in str(obj.business_phone) or not obj.business_phone:
            obj.whatsapp_number = '917042129273'
            obj.business_phone = '+91 70421 29273'
            updated = True
        if updated:
            obj.save()
        return obj
