import type { DatePrecision, Season } from '../lib/dates'

export type MemberRole = 'admin' | 'member'
export type MediaKind = 'photo' | 'link'

export type Family = {
  id: string
  name: string
  created_at: string
}

export type Person = {
  id: string
  family_id: string
  display_name: string
  birth_year: number | null
  death_year: number | null
  bio: string | null
  avatar_path: string | null
  user_id: string | null
  invite_email: string | null
  role: MemberRole | null
  created_by: string | null
  created_at: string
}

export type Story = {
  id: string
  family_id: string
  title: string
  occurred_year: number
  occurred_month: number | null
  occurred_day: number | null
  precision: DatePrecision
  circa: boolean
  season: Season | null
  place_name: string | null
  place_lat: number | null
  place_lng: number | null
  created_by_person_id: string
  created_at: string
  updated_at: string
}

export type Perspective = {
  id: string
  story_id: string
  author_person_id: string
  body: string
  is_original: boolean
  created_at: string
  updated_at: string
}

export type Media = {
  id: string
  family_id: string
  story_id: string
  kind: MediaKind
  storage_path: string | null
  url: string | null
  title: string | null
  sort_order: number
  uploaded_by: string
  created_at: string
}

export type Comment = {
  id: string
  story_id: string
  perspective_id: string | null
  author_person_id: string
  body: string
  created_at: string
}

export type Reaction = {
  id: string
  story_id: string
  perspective_id: string | null
  author_person_id: string
  emoji: string
  created_at: string
}

export type StoryPersonRow = {
  story_id: string
  person_id: string
}

export type PerspectiveWithAuthor = Perspective & { author: Person }

export type StoryListItem = Story & {
  people: Person[]
  perspective_count: number
  first_photo_path: string | null
  photo_paths: string[]
}

export type StoryDetail = Story & {
  people: Person[]
  perspectives: PerspectiveWithAuthor[]
  media: Media[]
  creator: Person
}
