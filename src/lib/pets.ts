import type { PetId } from '@/lib/models'

export type PetDef = {
  id: PetId
  name: string
}

type GlobModule = { default: string }

// 自动扫描：src/assets/pets/*/*.(webp|png|jpg|jpeg|gif)
// 路径示例：/src/assets/pets/三花十阶段图片/1.webp
const petStageModules = import.meta.glob('@/assets/pets/*/*.{webp,png,jpg,jpeg,gif}', { eager: true }) as Record<
  string,
  GlobModule
>

const STAGE_RE = /\/assets\/pets\/([^/]+)\/(\d+)\.(webp|png|jpg|jpeg|gif)$/i

const stageMap = new Map<string, Map<number, string>>()
const petNameSet = new Set<string>()

for (const [path, mod] of Object.entries(petStageModules)) {
  const m = path.match(STAGE_RE)
  if (!m) continue
  const folder = decodeURIComponent(m[1]!)
  const stage = Number.parseInt(m[2]!, 10)
  if (!Number.isFinite(stage)) continue

  petNameSet.add(folder)
  if (!stageMap.has(folder)) stageMap.set(folder, new Map())
  stageMap.get(folder)!.set(stage, mod.default)
}

function displayNameFromFolder(folder: string): string {
  return folder.replace(/十阶段图片$/, '')
}

export const PETS: PetDef[] = Array.from(petNameSet)
  .sort((a, b) => a.localeCompare(b, 'zh-CN'))
  .map((folder) => ({ id: folder, name: displayNameFromFolder(folder) }))

export function petStageSrc(petId: PetId, level: number): string | undefined {
  const stage = Math.min(10, Math.max(1, Math.floor(level || 1)))
  return stageMap.get(petId)?.get(stage) ?? stageMap.get(petId)?.get(1)
}

export function firstPet(): PetDef | undefined {
  return PETS[0]
}

