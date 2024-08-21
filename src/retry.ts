export async function retry<T>(fn: () => Promise<T>, retries: number, delayMs: number = 0): Promise<T> {
    let lastError: any;
  
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        const isLastAttempt = i === retries - 1;
        if (!isLastAttempt) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
  
    throw lastError;
  }
