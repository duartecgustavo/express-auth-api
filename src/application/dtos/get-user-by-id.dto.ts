import { IsNumberString } from "class-validator";

export class GetUserByIdDto {
  @IsNumberString({}, { message: "ID inválido. Deve ser um UUID válido" })
  id: string;
}
