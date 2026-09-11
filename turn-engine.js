function buildRoundTurnSequence(teams, roundNumber = 1) {
  const eligibleTeams = Array.isArray(teams)
    ? teams.filter(team => Array.isArray(team.members) && team.members.length > 0)
    : [];

  if (!eligibleTeams.length) {
    return [];
  }

  const teamOrder = eligibleTeams.map(team => ({
    teamName: team.name,
    members: team.members.filter(member => typeof member === 'string' && member.trim())
  }));

  const sequence = [];
  const maxMemberCount = Math.max(...teamOrder.map(team => team.members.length), 1);

  for (const team of teamOrder) {
    for (let playerIndex = 0; playerIndex < team.members.length; playerIndex++) {
      const member = team.members[playerIndex];

      if (!member) {
        continue;
      }

      sequence.push({
        roundNumber,
        teamName: team.teamName,
        playerName: member,
        turnIndex: sequence.length
      });
    }
  }

  const teamCount = teamOrder.length;
  if (teamCount > 1 && sequence.length < maxMemberCount * teamCount) {
    return buildRoundTurnSequence(teamOrder.map(team => ({ ...team, members: team.members.slice(0, maxMemberCount) })), roundNumber);
  }

  return sequence;
}

module.exports = {
  buildRoundTurnSequence
};
