/**
 * StageService - Manages individual stage instances within task journeys
 * Handles stage-level operations, status transitions, and approvals
 */

const STAGE_STATUS = {
  WAITING: 'waiting',
  PENDING_DOER: 'pending_doer',
  PENDING_CHECKER: 'pending_checker',
  PENDING_TEAM_LEADER: 'pending_team_leader',
  COMPLETED: 'completed',
  REOPENED: 'reopened',
  CANCELLED: 'cancelled'
};

export const StageService = {

  /**
   * Create a new stage instance
   */
  createStageInstance: (stageData) => {
    const now = new Date().toISOString();

    return {
      stageId: stageData.stageId || `stage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stageOrder: stageData.stageOrder,
      categoryId: stageData.categoryId,
      categoryName: stageData.categoryName || '',

      status: stageData.status || STAGE_STATUS.WAITING,

      assignedDoerId: stageData.assignedDoerId || null,
      assignedDoerName: stageData.assignedDoerName || '',
      assignedCheckerId: stageData.assignedCheckerId || null,
      assignedCheckerName: stageData.assignedCheckerName || '',
      assignedTeamLeaderId: stageData.assignedTeamLeaderId || null,
      assignedTeamLeaderName: stageData.assignedTeamLeaderName || '',

      worksheetTemplateId: stageData.worksheetTemplateId || null,
      checklistTemplateId: stageData.checklistTemplateId || null,
      worksheetSubmissionId: stageData.worksheetSubmissionId || null,
      worksheetData: stageData.worksheetData || {},

      preFilledFields: stageData.preFilledFields || {},

      activatedAt: stageData.activatedAt || null,
      doerSubmittedAt: null,
      checkerApprovedAt: null,
      checkerComments: null,
      checkerMistakesFound: 0,
      teamLeaderApprovedAt: null,
      teamLeaderComments: null,
      completedAt: null,

      reopenCount: 0,
      lastReopenedAt: null,
      reopenHistory: [],

      childStageIds: stageData.childStageIds || [],

      createdAt: now,
      updatedAt: now
    };
  },

  /**
   * Update stage instance
   */
  updateStageInstance: (stageInstance, updateData) => {
    return {
      ...stageInstance,
      ...updateData,
      stageId: stageInstance.stageId,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Activate a stage (make it pending for doer)
   */
  activateStage: (stageInstance) => {
    const now = new Date().toISOString();

    return {
      ...stageInstance,
      status: STAGE_STATUS.PENDING_DOER,
      activatedAt: now,
      updatedAt: now
    };
  },

  /**
   * Submit stage for checker review
   */
  submitStageForReview: (stageInstance, worksheetData, submissionId) => {
    const now = new Date().toISOString();

    return {
      ...stageInstance,
      status: STAGE_STATUS.PENDING_CHECKER,
      worksheetData: worksheetData || {},
      worksheetSubmissionId: submissionId || null,
      doerSubmittedAt: now,
      updatedAt: now
    };
  },

  /**
   * Approve stage by checker
   */
  approveStageByChecker: (stageInstance, checkerData) => {
    const now = new Date().toISOString();

    return {
      ...stageInstance,
      status: STAGE_STATUS.PENDING_TEAM_LEADER,
      checkerApprovedAt: now,
      checkerComments: checkerData.comments || null,
      checkerMistakesFound: checkerData.mistakesFound || 0,
      updatedAt: now
    };
  },

  /**
   * Approve stage by team leader
   */
  approveStageByTeamLeader: (stageInstance, teamLeaderData) => {
    const now = new Date().toISOString();

    return {
      ...stageInstance,
      status: STAGE_STATUS.COMPLETED,
      teamLeaderApprovedAt: now,
      teamLeaderComments: teamLeaderData.comments || null,
      completedAt: now,
      updatedAt: now
    };
  },

  /**
   * Reopen a completed stage
   */
  reopenStage: (stageInstance, reopenData) => {
    const now = new Date().toISOString();

    const reopenRecord = {
      reopenId: `reopen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reopenedAt: now,
      reopenedBy: reopenData.reopenedBy,
      reopenedByName: reopenData.reopenedByName || '',
      reason: reopenData.reason || '',
      sentTo: reopenData.sentTo || 'doer',
      resolvedAt: null,
      resubmittedAt: null,
      checkerReapprovedAt: null,
      teamLeaderReapprovedAt: null
    };

    return {
      ...stageInstance,
      status: STAGE_STATUS.REOPENED,
      reopenCount: (stageInstance.reopenCount || 0) + 1,
      lastReopenedAt: now,
      reopenHistory: [...(stageInstance.reopenHistory || []), reopenRecord],
      updatedAt: now
    };
  },

  /**
   * Mark stage as cancelled
   */
  cancelStage: (stageInstance, reason) => {
    const now = new Date().toISOString();

    return {
      ...stageInstance,
      status: STAGE_STATUS.CANCELLED,
      cancelledAt: now,
      cancellationReason: reason || '',
      updatedAt: now
    };
  },

  /**
   * Get stage display status
   */
  getStageDisplayStatus: (stageInstance) => {
    switch (stageInstance.status) {
      case STAGE_STATUS.WAITING:
        return 'Waiting';
      case STAGE_STATUS.PENDING_DOER:
        return 'Pending Doer Submission';
      case STAGE_STATUS.PENDING_CHECKER:
        return 'Pending Checker Review';
      case STAGE_STATUS.PENDING_TEAM_LEADER:
        return 'Pending Team Leader Approval';
      case STAGE_STATUS.COMPLETED:
        return 'Stage Completed';
      case STAGE_STATUS.REOPENED:
        return 'Reopened';
      case STAGE_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  },

  /**
   * Check if stage can be reopened
   */
  canReopenStage: (stageInstance) => {
    return stageInstance.status === STAGE_STATUS.COMPLETED;
  },

  /**
   * Get stage progress percentage
   */
  getStageProgress: (stageInstance) => {
    switch (stageInstance.status) {
      case STAGE_STATUS.WAITING:
        return 0;
      case STAGE_STATUS.PENDING_DOER:
        return 25;
      case STAGE_STATUS.PENDING_CHECKER:
        return 50;
      case STAGE_STATUS.PENDING_TEAM_LEADER:
        return 75;
      case STAGE_STATUS.COMPLETED:
        return 100;
      case STAGE_STATUS.REOPENED:
        return 50;
      case STAGE_STATUS.CANCELLED:
        return 0;
      default:
        return 0;
    }
  }
};

export { STAGE_STATUS };
export default StageService;
