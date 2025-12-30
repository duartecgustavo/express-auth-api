import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: "Email inválido" })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  @MaxLength(100, { message: "Senha muito longa" })
  password?: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: "Nome deve ter no mínimo 2 caracteres" })
  @MaxLength(100, { message: "Nome muito longo" })
  name?: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}
