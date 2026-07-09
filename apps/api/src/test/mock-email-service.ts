import { Global, Module } from '@nestjs/common';
import { EmailService } from '../email/email.service';

export const mockEmailService = {
  sendVerificationCode: () => Promise.resolve(),
  sendInvitationEmail: () => Promise.resolve(),
};

@Global()
@Module({
  providers: [{ provide: EmailService, useValue: mockEmailService }],
  exports: [EmailService],
})
export class MockEmailModule {}
