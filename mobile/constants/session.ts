// Module state lives only for the current app launch, so Welcome shows once per launch (not after every logout).
let welcomeSeen = false;
export const hasSeenWelcome = (): boolean => welcomeSeen;
export const markWelcomeSeen = (): void => { welcomeSeen = true; };
