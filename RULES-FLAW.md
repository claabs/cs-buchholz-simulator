# The 2024 Copenhagen Major Swiss Flaw

## The Problem

With the introduction of the new [Initial Swiss Matchups rule](https://github.com/ValveSoftware/counter-strike/blob/main/major-supplemental-rulebook.md?plain=1#L324-L335) added for the 2024 Copenhagen Major cycle, an unintended consequence was created.

With all matchups 50/50, there's about 0.6% chance that 1-1 record teams in round 3 cannot find valid matchups. It can cause the round 3 matchups selection to force a rematch, which is not allowed by the [current ruleset](https://github.com/ValveSoftware/counter-strike/blob/main/major-supplemental-rulebook.md?plain=1#L303):

 >In round 2 and 3, the highest seeded team faces the lowest seeded team available that does not result in a rematch within the stage.

There's no clarity in the ruleset how this matchup problem should be resolved, so those simulated event failures are excluded from the results.

## Example Matchups

Here's an example round 3 1-1 matchup pool, ordered by difficulty then initial seed:

| Team          | Seed | Difficulty | Previous Opponents                  |
|---------------|------|------------|-------------------------------------|
| Cloud9        | 3    | 2          | OG (1-1), Nexus (2-0)               |
| SAW           | 5    | 2          | Zero Tenacity (1-1), Permitta (2-0) |
| BetBoom       | 6    | 2          | JANO (1-1), SINNERS (2-0)           |
| fnatic        | 16   | 2          | 9 Pandas (1-1), Natus Vincere (2-0) |
| 9 Pandas      | 8    | -2         | fnatic (1-1), ECSTATIC (0-2)        |
| OG            | 11   | -2         | Cloud9 (1-1), 3DMAX (0-2)           |
| Zero Tenacity | 13   | -2         | SAW (1-1), BIG (0-2)                |
| JANO          | 14   | -2         | BetBoom (1-1), Virtus.pro (0-2)     |

The matchups are created from highest seed first, picking the lowest seed that doesn't result in a rematch:

- *Cloud9* is top seed, so they pair with the bottom seed *JANO* first
- *SAW* is next highest seed, but already played *Zero Tenacity*, so they pair with the next lowest seed, which is *OG*
- *BetBoom* is next highest seed, and pair with the lowest seed, which is *Zero Tenacity*
- ***fnatic* and *9 Pandas* remain, but they already played round 1. Here lies the issue.**

| Team A     | Team B        |
|------------|---------------|
| Cloud9     | JANO          |
| SAW        | OG            |
| BetBoom    | Zero Tenacity |
| **fnatic** | **9 Pandas**  |

## Author's Opinion

I'm not sure why the new Initial Swiss Matchups were added. My guess is it's due to not disadvantage the open qualifier teams in initial seeding. However, it causes this issue in subsequent rounds when the seed matchup approach changes.

Valve should either:

1. Seed the teams initially to meet their initial matchup goals (invite team, closed team, invite team, closed team, etc.) and revert the Initial Swiss Matchups rule
1. Seed the teams according to ranking points and revert the Initial Swiss Matchups rule
