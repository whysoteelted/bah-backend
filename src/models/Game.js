import uuid from 'uuid';
import { getDeck } from './Deck';
import Player from './Player';

const MAX_PLAYERS = 8;

const CARDS_FOR_PLAYER = 10;

const GAME_STATUS = {
  WAIT_FOR_PLAYER: 0,
  STARTED: 10,
  COMPLETED: 90
};

class Game {
  uuid;

  status;

  players;

  owner;

  deck;

  current_question;

  card_czar;

  current_answers = [];

  constructor(owner) {
    this.uuid = uuid.v4();
    this.status = GAME_STATUS.WAIT_FOR_PLAYER;
    this.deck = getDeck();
    this.owner = owner;
    this.players = [];
  }

  addPlayer(player_name) {
    if (this.status !== GAME_STATUS.WAIT_FOR_PLAYER) {
      throw new Error('Could not add player at this time');
    }
    if (this.players.length >= MAX_PLAYERS) {
      throw new Error('Too many players');
    }
    const player = new Player(player_name);
    player.answers = this.deck.answers.splice(0, CARDS_FOR_PLAYER);
    this.players.push(player);
    return player;
  }

  getPlayers() {
    return this.players.map(player => {
      const { uuid, name, points } = player;
      return { uuid, name, points };
    });
  }

  getPlayerByUUID(player_uuid) {
    return this.players.filter(player => player.uuid === player_uuid)[0].name;
  }

  getFullPlayerByUUID(player_uuid) {
    return this.players.filter(player => player.uuid === player_uuid)[0];
  }

  start() {
    this.status = GAME_STATUS.STARTED;
    this.card_czar = 0;
    this.current_question = -1;
  }

  nextRound() {
    this.card_czar++;
    if (this.card_czar >= this.players.length) {
      this.card_czar = 0;
    }
    this.current_question++;
    const checkQuestion = () => {
      return this.deck.questions[this.current_question].numAnswers === 1;
    };
    while (!checkQuestion()) {
      this.current_question++;
    }
    this.current_answers = [];
    const { uuid, name } = this.players[this.card_czar];
    return {
      question: this.deck.questions[this.current_question],
      card_czar: {
        uuid,
        name
      }
    };
  }

  addAnswer(player_uuid, answer) {
    this.current_answers.push({
      player_uuid,
      answer
    });
    this.players.map(player => {
      if (player.uuid === player_uuid) {
        player.removeCards(answer);
        let cards_to_add = 1;
        if (typeof answer.length !== 'undefined') {
          cards_to_add = answer.length;
        }
        const answers = this.deck.answers.splice(0, cards_to_add);
        player.addCards(answers);
      }
    });
  }

  getAnswers() {
    const question = this.deck.questions[this.current_question];
    return this.current_answers.map(answer => {
      let text = question.text;
      if (text.indexOf('_') < 0) {
        text += `<strong>${answer.answer.text}</strong>`;
      } else {
        if (question.numAnswers === 1) {
          text = text.replace('_', ` <strong>${answer.answer.text}</strong> `);
        } else if (question.numAnswers > 1) {
          for (let i = 0; i < question.numAnswers; i++) {
            text = text.replace('_', ` <strong>${answer.answer.text[i]}</strong> `);
          }
        }
      }

      return {
        player_uuid: answer.player_uuid,
        text
      };
    });
  }

  addPoint(player_uuid) {
    this.players.forEach(player => {
      if (player.uuid === player_uuid) {
        player.points++;
      }
    });
  }
}

export default Game;