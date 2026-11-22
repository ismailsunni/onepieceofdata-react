import { queryOptions } from '@tanstack/react-query'
import { fetchArcs } from '../services/arcService'
import { fetchSagas } from '../services/sagaService'

export const arcsQuery = queryOptions({
  queryKey: ['arcs'],
  queryFn: fetchArcs,
})
export const sagasQuery = queryOptions({
  queryKey: ['sagas'],
  queryFn: fetchSagas,
})
