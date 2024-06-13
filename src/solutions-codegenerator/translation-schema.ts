export interface TranslationSchema {
  title: [];
  greeting: [
    params: {
      username: string | number;
    },
  ];
  nextGame: [
    params: {
      player1: string | number;
      player2: string | number;
    },
  ];
}
