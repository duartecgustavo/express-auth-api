import { IsNumberString } from "class-validator";

export class DeleteUserByIdDto {
  @IsNumberString({}, { message: "ID inválido. Deve ser um UUID válido" })
  id: string;
}
