import platesData from '../data/plates.yaml'
import materialsData from '../data/materials.yaml'
import parametersData from '../data/parameters.yaml'
import nozzlesData from '../data/nozzles.yaml'
import gluesData from '../data/glues.yaml'
import materialGuideData from '../data/material-guide.yaml'

// Bundle every product file at build time.
const productModules = import.meta.glob('../data/products/*.yaml', { eager: true })
const products = Object.values(productModules)
  .map((m) => m.default)
  .sort((a, b) => `${a.manufacturer} ${a.name}`.localeCompare(`${b.manufacturer} ${b.name}`))

const plates = [...platesData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

export function useCatalog() {
  return {
    plates,
    materials: materialsData,
    parameters: parametersData,
    products,
    nozzleSizes: nozzlesData.sizes,
    nozzleTypes: nozzlesData.types,
    glues: gluesData.glues ?? [],
    plateGlueGuidance: gluesData.plateGlueGuidance ?? null,
    materialGuides: materialGuideData.guides ?? [],
    materialGuideSource: materialGuideData.source ?? null,
  }
}
