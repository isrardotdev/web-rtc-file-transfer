export const createRoomId = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let roomId = '';
    for (let i = 0; i < 9; i++) {
        roomId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return `${roomId.slice(0, 3)}-${roomId.slice(3, 6)}-${roomId.slice(6, 9)}`;
}
