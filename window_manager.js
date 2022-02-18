var wmanager = {
    clearBoard: () => {
        document.getElementById('board_cards').innerHTML = '';
    },
    showHandWinner: (playerName) => {
        document.getElementById('hand_winner').innerHTML = playerName;
    },
    showTrump: (trump) => {
        document.getElementById('trump').innerHTML = trump;
    }
};