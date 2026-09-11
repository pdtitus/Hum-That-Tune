const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeLobbyTeams,
  getTeamActionState,
  applyTeamMembershipChange,
  getRoomPhase,
  isActivePlayerView,
  getPlayerGameView
} = require('../lobby-state.js');
const { buildRoundTurnSequence } = require('../turn-engine.js');

test('host can rejoin a team after leaving it', () => {
  const state = {
    status: 'lobby',
    teams: [{
      name: 'Team Alpha',
      owner: 'Host',
      members: [],
      songOptions: ['70s:Easy']
    }]
  };

  const teams = normalizeLobbyTeams(state);
  const action = getTeamActionState(teams[0], 'Host');

  assert.equal(action.isOwner, true);
  assert.equal(action.isMember, false);
  assert.equal(action.canJoin, true);
  assert.equal(action.canLeave, false);
});

test('non-host players can join a team they are not in', () => {
  const team = {
    name: 'Team Bravo',
    owner: 'Host',
    members: ['Alice'],
    songOptions: ['80s:Medium']
  };

  const action = getTeamActionState(team, 'Bob');

  assert.equal(action.isOwner, false);
  assert.equal(action.isMember, false);
  assert.equal(action.canJoin, true);
  assert.equal(action.canLeave, false);
  assert.equal(action.warning, null);
});

test('players can still join when already on another team, but a warning is returned', () => {
  const scenario = [{
    name: 'Team One',
    owner: 'Host',
    members: ['Bob'],
    songOptions: ['70s:Easy']
  }, {
    name: 'Team Two',
    owner: 'Host',
    members: ['Alice'],
    songOptions: ['80s:Medium']
  }];

  const action = getTeamActionState(scenario[1], 'Bob', scenario);

  assert.equal(action.canJoin, true);
  assert.equal(action.alreadyOnAnotherTeam, true);
  assert.equal(action.warning.includes('Warning:'), true);
});

test('join and leave actions update the membership list without dropping the team owner', () => {
  const state = {
    status: 'lobby',
    teams: [{
      name: 'Team Charlie',
      owner: 'Host',
      members: ['Host'],
      songOptions: ['90s:Hard']
    }]
  };

  const joined = applyTeamMembershipChange(state, 'Team Charlie', 'Bob', 'join');
  const left = applyTeamMembershipChange(joined, 'Team Charlie', 'Bob', 'leave');

  assert.deepEqual(joined.teams[0].members, ['Host', 'Bob']);
  assert.deepEqual(left.teams[0].members, ['Host']);
});

test('round rotation gives each player at least one turn before the round ends', () => {
  const teams = [
    { name: 'Team A', members: ['Alice', 'Bob', 'Cara'] },
    { name: 'Team B', members: ['Dan', 'Eve', 'Frank'] }
  ];

  const sequence = buildRoundTurnSequence(teams, 1);
  const playerNames = sequence.map(turn => turn.playerName);

  assert.equal(sequence.length, 6);
  assert.deepEqual([...new Set(playerNames)].sort(), ['Alice', 'Bob', 'Cara', 'Dan', 'Eve', 'Frank']);
  assert.equal(sequence[0].teamName, 'Team A');
  assert.equal(sequence[1].playerName, 'Bob');
  assert.equal(sequence[3].teamName, 'Team B');
});

test('single-team round sequence includes both players before the round rotates', () => {
  const teams = [
    { name: 'Team A', members: ['Alice', 'Bob'] }
  ];

  const sequence = buildRoundTurnSequence(teams, 1);

  assert.deepEqual(sequence.map(turn => `${turn.teamName}:${turn.playerName}`), ['Team A:Alice', 'Team A:Bob']);
});

test('two-team round sequence includes both players from team 2 in the same round', () => {
  const teams = [
    { name: 'Team A', members: ['Alice'] },
    { name: 'Team B', members: ['Bob', 'Cara'] }
  ];

  const sequence = buildRoundTurnSequence(teams, 1);

  assert.deepEqual(sequence.map(turn => `${turn.teamName}:${turn.playerName}`), ['Team A:Alice', 'Team B:Bob', 'Team B:Cara']);
});

test('playing state moves clients out of the lobby and into active gameplay', () => {
  assert.equal(getRoomPhase({ status: 'lobby' }), 'lobby');
  assert.equal(getRoomPhase({ status: 'playing' }), 'game');
  assert.equal(getRoomPhase({ status: 'complete' }), 'game');
});

test('only the active player sees the private song state while everyone else stays in shared view', () => {
  const state = {
    status: 'playing',
    activePlayerName: 'Alice',
    currentRound: 1,
    teams: [{ name: 'Team A', members: ['Alice', 'Bob'], score: 0 }]
  };

  assert.equal(isActivePlayerView(state, 'Alice'), true);
  assert.equal(isActivePlayerView(state, 'Bob'), false);
  assert.equal(isActivePlayerView({ status: 'lobby' }, 'Bob'), false);
  assert.equal(getPlayerGameView(state, 'Alice'), 'player');
  assert.equal(getPlayerGameView({ ...state, currentSong: { title: 'Song A' } }, 'Alice'), 'song');
  assert.equal(getPlayerGameView(state, 'Bob'), 'spectator');
});
