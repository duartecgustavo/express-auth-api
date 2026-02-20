import {
  Allow,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
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
  @IsString()
  @MinLength(2, { message: "Nickname deve ter no mínimo 2 caracteres" })
  @MaxLength(50, { message: "Nickname muito longo" })
  nickname?: string;

  @IsOptional()
  @ValidateIf((_, v) => v != null && v !== "")
  @IsString()
  @MaxLength(255)
  linkedin?: string | null;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;
}
