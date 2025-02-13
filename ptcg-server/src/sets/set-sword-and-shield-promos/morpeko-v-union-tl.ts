import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SuperType, EnergyType, CardTag } from '../../game/store/card/card-types';
import { AttachEnergyPrompt, CardTarget, EnergyCard, GameError, GameMessage, PlayerType, PokemonCardList, PowerType, SlotType, State, StateUtils, StoreLike } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect, PowerEffect } from '../../game/store/effects/game-effects';
import { DiscardCardsEffect } from '../../game/store/effects/attack-effects';
import {MorpekoVUNIONTopRight} from './morpeko-v-union-tr';
import {MorpekoVUNIONBottomLeft} from './morpeko-v-union-bl';
import {MorpekoVUNIONBottomRight} from './morpeko-v-union-br';

export class MorpekoVUNIONTopLeft extends PokemonCard {
  public stage: Stage = Stage.VUNION;
  public tags = [CardTag.POKEMON_VUNION];
  public cardType: CardType = L;
  public hp: number = 310;
  public weakness = [{ type: F }];
  public retreat = [C, C];

  public powers = [
    {
      name: 'Morpeko V-UNION Assembly',
      text: 'Once per game during your turn, combine 4 different Morpeko V-UNION from your discard pile and put them onto your bench.',
      useFromDiscard: true,
      exemptFromAbilityLock: true,
      powerType: PowerType.ABILITY
    }
  ];

  public attacks = [
    {
      name: 'Union Gain',
      cost: [C],
      damage: 0,
      text: 'Attach up to 2 [L] Energy cards from your discard pile to this Pokémon.'
    },
    {
      name: 'All You Can Eat',
      cost: [C, C],
      damage: 0,
      text: 'Draw cards until you have 10 cards in your hand.'
    },
    {
      name: 'Burst Wheel',
      cost: [L, C, C],
      damage: 100,
      damageCalculation: 'x',
      text: 'Discard all Energy from this Pokémon. This attack does 100 damage for each card you discarded in this way.'
    },
    {
      name: 'Electric Ball',
      cost: [L, C, C],
      damage: 160,
      text: ''
    }
  ];

  public set: string = 'SWSH';
  public regulationMark = 'E';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '215';
  public name: string = 'Morpeko V-UNION';
  public fullName: string = 'Morpeko V-UNION (Top Left) SWSH';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    // assemblin the v-union
    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;
      const slots: PokemonCardList[] = player.bench.filter(b => b.cards.length === 0);

      if (player.assembledVUNIONs.includes(this.name)) {
        throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
      }
      if (slots.length === 0) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      let topLeftPiece = false;
      let topRightPiece = false;
      let bottomLeftPiece = false;
      let bottomRightPiece = false;
      player.discard.cards.forEach(card => {
        if (card instanceof MorpekoVUNIONTopLeft) { topLeftPiece = true; }
        if (card instanceof MorpekoVUNIONTopRight) { topRightPiece = true; }
        if (card instanceof MorpekoVUNIONBottomLeft) { bottomLeftPiece = true; }
        if (card instanceof MorpekoVUNIONBottomRight) { bottomRightPiece = true; }
      });

      if (topLeftPiece && topRightPiece && bottomLeftPiece && bottomRightPiece) {
        if (slots.length > 0) {
          player.discard.cards.forEach(card => { if (card instanceof MorpekoVUNIONTopRight) { player.discard.moveCardTo(card, slots[0]); } });
          player.discard.cards.forEach(card => { if (card instanceof MorpekoVUNIONBottomLeft) { player.discard.moveCardTo(card, slots[0]); } });
          player.discard.cards.forEach(card => { if (card instanceof MorpekoVUNIONBottomRight) { player.discard.moveCardTo(card, slots[0]); } });
          // gotta make sure the actual mon ends up on top
          player.discard.cards.forEach(card => { if (card instanceof MorpekoVUNIONTopLeft) { player.discard.moveCardTo(card, slots[0]); } });
          player.assembledVUNIONs.push(this.name);
          slots[0].pokemonPlayedTurn = state.turn;
        }
      } else {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }
    }

    // Union Gain
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;

      let lightningsInDiscard = 0;
      // checking for energies in the discard
      player.discard.cards.forEach(card => {
        if (card instanceof EnergyCard && card.energyType === EnergyType.BASIC && card.name === 'Lightning Energy') {
          lightningsInDiscard++;
        }
      });

      if (lightningsInDiscard > 0) {
        const blocked: CardTarget[] = [];
        player.forEachPokemon(PlayerType.BOTTOM_PLAYER, (list, card, target) => {
          if (card !== this) {
            blocked.push(target);
          }
        });

        state = store.prompt(state, new AttachEnergyPrompt(
          player.id,
          GameMessage.ATTACH_ENERGY_TO_BENCH,
          player.discard,
          PlayerType.BOTTOM_PLAYER,
          [SlotType.BENCH, SlotType.ACTIVE],
          { superType: SuperType.ENERGY, energyType: EnergyType.BASIC, name: 'Lightning Energy' },
          { allowCancel: false, min: 0, max: Math.min(2, lightningsInDiscard), blockedTo: blocked }
        ), transfers => {
          transfers = transfers || [];
          // cancelled by user
          if (transfers.length === 0) {
            return;
          }
          for (const transfer of transfers) {
            const target = StateUtils.getTarget(state, player, transfer.to);
            player.discard.moveCardTo(transfer.card, target);
          }
        });
      }
    }

    // All You Can Eat
    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      
      if (player.hand.cards.length >= 10){
        return state;
      }
      if (player.deck.cards.length === 0){
        return state;
      }

      while (player.hand.cards.length < 10 && player.deck.cards.length > 0){
        player.deck.moveTo(player.hand, 1);
      }
    }

    // Burst Wheel
    if (effect instanceof AttackEffect && effect.attack === this.attacks[2]) {
      const player = effect.player;
      
      const energies = player.active.cards.filter(card => card instanceof EnergyCard );

      const discardEnergy = new DiscardCardsEffect(effect, energies);
      discardEnergy.target = player.active;
      store.reduceEffect(state, discardEnergy);

      effect.damage = energies.length * 100;
    }

    return state;
  }
}