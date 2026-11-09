from django.db import models
from django.conf import settings

class Rating(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='given_ratings')
    target_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_ratings')
    stars = models.IntegerField(default=5) # 1-5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'target_user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} rated {self.target_user.username} with {self.stars} stars"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.target_user.update_rating()
