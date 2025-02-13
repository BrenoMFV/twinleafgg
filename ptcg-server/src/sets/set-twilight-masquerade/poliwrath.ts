import { Attack, CardType, GameMessage, PokemonCard, Stage, State, StoreLike, Weakness } from '../../game';
import { Effect } from '../../game/store/effects/effect';
import { AfterAttackEffect } from '../../game/store/effects/game-phase-effects';
import { YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP } from '../../game/store/prefabs/attack-effects';
import { CONFIRMATION_PROMPT, SHUFFLE_DECK, WAS_ATTACK_USED } from '../../game/store/prefabs/prefabs';

export class Poliwrath extends PokemonCard {

  public stage: Stage = Stage.STAGE_2;
  public evolvesFrom: string = 'Poliwhirl';
  public cardType: CardType = W;
  public hp: number = 170;
  public weakness: Weakness[] = [{ type: L }];
  public retreat: CardType[] = [C, C, C];

  public attacks: Attack[] = [
    {
      name: 'Hypnosis',
      cost: [W],
      damage: 0,
      text: 'Your opponent\'s Active Pokémon is now Asleep.'
    },
    {
      name: 'Jumping Uppercut',
      cost: [C, C],
      damage: 120,
      damageCalculation: '+',
      text: 'You may do 120 more damage. If you do, shuffle this Pokémon and all attached cards into your deck.'
    },
  ];

  public set: string = 'TWM';
  public regulationMark: string = 'H';
  public cardImage: string = 'assets/cardback.png';
  public setNumber: string = '43';
  public name: string = 'Poliwrath';
  public fullName: string = 'Poliwrath TWM';

  public shuffleIntoDeck: boolean = false;

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (WAS_ATTACK_USED(effect, 0, this)) {
      YOUR_OPPPONENTS_ACTIVE_POKEMON_IS_NOW_ASLEEP(store, state, effect);
    }

    if (WAS_ATTACK_USED(effect, 1, this)) {
      return CONFIRMATION_PROMPT(store, state, effect.player, (result) => {
        if (!result) {
          return state;
        }
        effect.damage += 120;
        this.shuffleIntoDeck = true;
      }, GameMessage.WANT_TO_DEAL_MORE_DAMAGE);
    }


    if (effect instanceof AfterAttackEffect && this.shuffleIntoDeck) {
      const player = effect.player;

      player.active.clearEffects();
      this.shuffleIntoDeck = false;

      player.active.moveTo(player.deck);
      SHUFFLE_DECK(store, state, player);
    }

    return state;
  }
}