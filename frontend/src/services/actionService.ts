export class ActionService {
  /**
   * Generates actionable recommendations based on probable root causes
   */
  public getRecommendationsForDefect(machineId: string, _defectType: string, probableFactor: string): string[] {
    const actions: string[] = [];

    if (probableFactor.toLowerCase().includes('vibration')) {
      actions.push(`Halt ${machineId} production cycle to perform spindle & bearing vibration check`);
      actions.push(`Inspect tool holding assembly and guide pin clearances on ${machineId}`);
    } else if (probableFactor.toLowerCase().includes('thermal')) {
      actions.push(`Inspect cooling jacket fluid levels and heat exchanger flow on ${machineId}`);
      actions.push(`Verify thermal expansion compensation offsets in CNC controller`);
    } else {
      actions.push(`Check raw material lot hardness and surface coating specification`);
    }

    actions.push(`Quarantine affected batch units produced during defect window`);
    actions.push(`Perform mandatory reinspection of 20 test parts before resuming full speed production`);

    return actions;
  }
}

export const actionService = new ActionService();
