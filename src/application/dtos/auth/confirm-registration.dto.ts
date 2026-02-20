import { IsEmail, IsString, Length } from "class-validator";

export class ConfirmRegistrationDto {
  @IsEmail({}, { message: "Email inválido" })
  email: string;

  @IsString()
  @Length(6, 6, { message: "Código deve ter 6 dígitos" })
  code: string;
}
