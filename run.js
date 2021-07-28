const fs = require('fs')
const child_process = require('child_process')
const runID = Math.random().toString(16).substring(2)

fs.mkdirSync(`/tmp/multi-gource${runID}`)
fs.mkdirSync(`/tmp/multi-gource${runID}/repos`)
fs.mkdirSync(`/tmp/multi-gource${runID}/logs`)
fs.mkdirSync(`/tmp/multi-gource${runID}/videos`)

const repos = fs.readFileSync('list.txt', 'utf8').split('\n').filter(l => l[0] !== '#' && l !== '')

repos.forEach((repo, index, array) => {
  const repoName = repo.split('/').pop()
  console.log(`(${index+1}/${array.length}) Cloning ${repoName}`)
  child_process.execSync(`git clone ${repo} /tmp/multi-gource${runID}/repos/${repoName}; gource --output-custom-log /tmp/multi-gource${runID}/logs/${repoName}.txt /tmp/multi-gource${runID}/repos/${repoName}`)
})

console.log('Combining logs')
repos.forEach((repo) => {
  const repoName = repo.split('/').pop()
  // This has only been test on Mac, and may act differently on Linux when using GNU sed
  child_process.execSync(`sed -E "s#(.+)\\|#\\1|/${repoName}#" /tmp/multi-gource${runID}/logs/${repoName}.txt > /tmp/multi-gource${runID}/logs/${repoName}-foldered.txt`)
})
child_process.execSync(`cat /tmp/multi-gource${runID}/logs/*-foldered.txt | sort -n > /tmp/multi-gource${runID}/logs/all.txt`)


console.log('Running gource')
child_process.execSync(`gource /tmp/multi-gource${runID}/logs/all.txt -s 0.06 --auto-skip-seconds 0.01 --multi-sampling --stop-at-end --hide mouse,filenames,dirnames -1280x720 -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 /tmp/multi-gource${runID}/videos/cat.mp4`)
child_process.execSync(`gource /tmp/multi-gource${runID}/logs/all.txt -s 0.06 --auto-skip-seconds 0.01 --multi-sampling --stop-at-end --hide mouse,filenames,dirnames,root -1280x720 -o - | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 1 -threads 0 -bf 0 /tmp/multi-gource${runID}/videos/no-root.mp4`)
console.log(`/tmp/multi-gource${runID}/videos/`)
