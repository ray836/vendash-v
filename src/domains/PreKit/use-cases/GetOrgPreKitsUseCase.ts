import { IPreKitRepository } from "@/domains/PreKit/interfaces/IPreKitRepository"

export class GetOrgPreKitsUseCase {
  constructor(private readonly preKitRepository: IPreKitRepository) {}

  async execute(orgId: string) {
    return this.preKitRepository.getOrgPreKits(orgId)
  }
}
