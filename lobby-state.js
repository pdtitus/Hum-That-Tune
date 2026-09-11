function normalizeLobbyTeams(state) {
  if (!state || !Array.isArray(state.teams)) {
    return [];
  }

  return state.teams.map(team => ({
    name: typeof team.name === 'string' ? team.name : 'Team',
    owner: typeof team.owner === 'string' ? team.owner : 'Host',
    members: Array.isArray(team.members) ? team.members.filter(member => typeof member === 'string') : [],
    songOptions: Array.isArray(team.songOptions) ? team.songOptions.filter(option => typeof option === 'string') : []
  }));
}

function getTeamActionState(team, currentPlayer, allTeams = []) {
  const members = Array.isArray(team.members) ? team.members : [];
  const isOwner = team.owner === currentPlayer;
  const isMember = members.includes(currentPlayer);
  const alreadyOnAnotherTeam = Array.isArray(allTeams) && allTeams.some(candidate => {
    if (candidate === team) {
      return false;
    }

    return Array.isArray(candidate.members) && candidate.members.includes(currentPlayer);
  });

  return {
    isOwner,
    isMember,
    alreadyOnAnotherTeam,
    canJoin: true,
    canLeave: isMember,
    canEdit: isOwner,
    canDelete: isOwner,
    warning: isMember
      ? 'You are already on this team.'
      : (alreadyOnAnotherTeam
        ? 'Warning: you are already on another team. This join is allowed, but keep the roster in mind.'
        : null)
  };
}

function applyTeamMembershipChange(state, teamName, playerName, action) {
  const teams = normalizeLobbyTeams(state);
  const targetIndex = teams.findIndex(team => team.name === teamName);

  if (targetIndex < 0) {
    return state;
  }

  const nextTeams = teams.map(team => ({
    ...team,
    members: Array.isArray(team.members) ? team.members.slice() : []
  }));

  const target = nextTeams[targetIndex];

  if (action === 'join' && !target.members.includes(playerName)) {
    target.members.push(playerName);
  }

  if (action === 'leave') {
    target.members = target.members.filter(member => member !== playerName);
  }

  return {
    ...state,
    teams: nextTeams
  };
}

function getRoomPhase(state) {
  if (!state || typeof state !== 'object') {
    return 'lobby';
  }

  if (state.status === 'playing' || state.status === 'complete') {
    return 'game';
  }

  return 'lobby';
}

function isGameInProgress(state) {
  return getRoomPhase(state) === 'game';
}

function isActivePlayerView(state, playerName) {
  if (!state || !state.status || state.status === 'lobby') {
    return false;
  }

  if (!state.activePlayerName || typeof playerName !== 'string') {
    return false;
  }

  return state.activePlayerName.trim() === playerName.trim();
}

module.exports = {
  normalizeLobbyTeams,
  getTeamActionState,
  applyTeamMembershipChange,
  getRoomPhase,
  isGameInProgress,
  isActivePlayerView
};
