function buildRoundTurnSequence(teams, roundNumber = 1) {
  const eligibleTeams = Array.isArray(teams)
    ? teams.filter(team => Array.isArray(team.members) && team.members.length > 0)
    : [];

  if (!eligibleTeams.length) {
    return [];
  }

  const sequence = [];

  for (const team of eligibleTeams) {
    const members = Array.isArray(team.members)
      ? team.members.filter(member => typeof member === 'string' && member.trim())
      : [];

    for (const member of members) {
      sequence.push({
        roundNumber,
        teamName: team.name,
        playerName: member.trim(),
        turnIndex: sequence.length
      });
    }
  }

  return sequence;
}

module.exports = {
  buildRoundTurnSequence
};
