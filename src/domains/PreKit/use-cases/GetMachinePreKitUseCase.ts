import { IPreKitRepository } from "../interfaces/IPreKitRepository"
import { GetMachinePreKitRequest } from "../schemas/GetMachinePreKitUseCase"
import { GetMachinePreKitResponse } from "../schemas/GetMachinePreKitUseCase"
import { IProductRepository } from "../../Product/repositories/IProductRepository"
export class GetMachinePreKitUseCase {
  constructor(
    private preKitRepository: IPreKitRepository,
    private productRepository: IProductRepository
  ) {}

  async execute(
    request: GetMachinePreKitRequest
  ): Promise<GetMachinePreKitResponse> {
    const preKit = await this.preKitRepository.getByMachineId(request.machineId)

    if (!preKit) throw new Error("PreKit not found")

    // Since the repository now returns all the required fields, we can use it directly
    return preKit
  }
}
