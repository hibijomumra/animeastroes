export function getEpisodeToPlay(episodes, isFinished, episodeParam) {
  const totalEp = episodes?.at(-1) ?? 1;
  return episodeParam ?? (isFinished ? episodes[0] : totalEp);
}
