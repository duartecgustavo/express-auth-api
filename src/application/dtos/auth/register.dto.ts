import { IsEmail, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterUserDto {
  @IsEmail({}, { message: "Email invalido" })
  email: string;

  @IsString()
  @MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  @MaxLength(100, { message: "Senha muito longa" })
  password: string;

  @IsString()
  @MinLength(2, { message: "Nome deve ter no mínimo 2 caracteres" })
  @MaxLength(100, { message: "Nome muito longo" })
  name: string;
}
