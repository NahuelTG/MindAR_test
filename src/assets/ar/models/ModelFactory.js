import { BeeModel } from './BeeModel'
import { WolfModel } from './WolfModel'

export class ModelFactory {
  static async createModel(modelType) {
    switch (modelType) {
      case 'bee':
        return await BeeModel.create()
      case 'wolf':
        return await WolfModel.create()
      default:
        throw new Error(`Modelo no soportado: ${modelType}`)
    }
  }
}
