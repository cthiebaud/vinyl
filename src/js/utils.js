// utils.js

export const Utils = {
    shuffleArray: (array) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]] // NEED ; before !!!
      }
      return array
    },
  
    // Add other utility functions here as needed
  };
  