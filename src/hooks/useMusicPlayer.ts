import { useContext } from 'react'
import { MusicPlayerContext } from '../context/MusicPlayerContext'

export function useMusicPlayer() {
  return useContext(MusicPlayerContext)
}
