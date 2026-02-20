import twilio from "twilio";
import { IVerificationService } from "../../domain/services/Verification.service";

export class TwilioVerificationService implements IVerificationService {
  private client: twilio.Twilio;
  private serviceSid: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";

    if (!accountSid || !authToken || !this.serviceSid) {
      throw new Error(
        "❌ Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID in .env"
      );
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendCode(email: string): Promise<void> {
    await this.client.verify.v2
      .services(this.serviceSid)
      .verifications.create({
        to: email,
        channel: "email",
      });
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const result = await this.client.verify.v2
      .services(this.serviceSid)
      .verificationChecks.create({
        to: email,
        code,
      });

    return result.status === "approved";
  }
}
