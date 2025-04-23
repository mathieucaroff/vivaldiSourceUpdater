export function retryAsync<T>(fn: () => Promise<T>, delay: number, retries: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const attempt = (n: number) => {
      fn()
        .then(resolve)
        .catch((error) => {
          console.log(`Attempt ${retries - n + 1} failed: ${error}`)
          if (n <= 1) {
            reject(error)
          } else {
            console.log(`Retrying in ${delay}ms...`)
            setTimeout(() => attempt(n - 1), delay)
          }
        })
    }
    attempt(retries)
  })
}
