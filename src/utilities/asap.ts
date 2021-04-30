export function Asap(func: () => void): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      func();
      resolve();
    });
  });
}
