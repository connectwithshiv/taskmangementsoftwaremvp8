/**
 * TaskJourneyUtils - Utilities for managing task journey data structure
 * Handles migration between old task structure and new stage-based structure
 */

import { StageService, STAGE_STATUS } from '../services/stageService';
import UserDependencyService from '../services/userDependencyService';
import WorkflowService from '../services/workflowService';
import WorksheetService from '../services/WorksheetService';

export const TaskJourneyUtils = {

  /**
   * Initialize stage instances for a new task journey
   */
  initializeStageInstances: (workflowId, userDependencyId) => {
    const workflow = WorkflowService.getWorkflowById(workflowId);
    const userDependency = UserDependencyService.getUserDependencyById(userDependencyId);

    if (!workflow || !userDependency) {
      return [];
    }

    const stageInstances = [];

    workflow.categoryFlow.forEach((flowStage, index) => {
      const stageAssignment = userDependency.stageAssignments.find(
        sa => sa.stageOrder === flowStage.order
      );

      if (stageAssignment) {
        const worksheetTemplate = WorksheetService.getTemplateByCategory(flowStage.categoryId);

        const stageInstance = StageService.createStageInstance({
          stageOrder: flowStage.order,
          categoryId: flowStage.categoryId,
          categoryName: flowStage.categoryName || stageAssignment.categoryName,
          assignedDoerId: stageAssignment.userId,
          assignedDoerName: stageAssignment.userName,
          assignedCheckerId: stageAssignment.checkerId,
          assignedCheckerName: stageAssignment.checkerName,
          assignedTeamLeaderId: stageAssignment.teamLeaderId || stageAssignment.checkerId,
          assignedTeamLeaderName: stageAssignment.teamLeaderName || stageAssignment.checkerName,
          worksheetTemplateId: worksheetTemplate?.id || null,
          status: index === 0 ? STAGE_STATUS.PENDING_DOER : STAGE_STATUS.WAITING,
          activatedAt: index === 0 ? new Date().toISOString() : null
        });

        stageInstances.push(stageInstance);
      }
    });

    return stageInstances;
  },

  /**
   * Migrate existing task to new structure
   * Converts old task format to include stageInstances
   */
  migrateTaskToJourney: (task) => {
    if (task.stageInstances && task.stageInstances.length > 0) {
      return task;
    }

    if (!task.workflowId || !task.userDependencyId) {
      return task;
    }

    const stageInstances = TaskJourneyUtils.initializeStageInstances(
      task.workflowId,
      task.userDependencyId
    );

    if (task.currentStage > 0 && task.stageHistory && task.stageHistory.length > 0) {
      task.stageHistory.forEach((historyEntry, index) => {
        const stageIndex = stageInstances.findIndex(
          si => si.stageOrder === historyEntry.stageOrder
        );

        if (stageIndex !== -1) {
          stageInstances[stageIndex] = {
            ...stageInstances[stageIndex],
            status: STAGE_STATUS.COMPLETED,
            worksheetData: historyEntry.outputData || {},
            doerSubmittedAt: historyEntry.approvedAt || null,
            checkerApprovedAt: historyEntry.approvedAt || null,
            teamLeaderApprovedAt: historyEntry.approvedAt || null,
            completedAt: historyEntry.approvedAt || null
          };
        }
      });

      const currentStageIndex = stageInstances.findIndex(
        si => si.stageOrder === task.currentStage
      );

      if (currentStageIndex !== -1) {
        let currentStatus = STAGE_STATUS.PENDING_DOER;

        if (task.status === 'submitted') {
          currentStatus = STAGE_STATUS.PENDING_CHECKER;
        } else if (task.status === 'under-review') {
          currentStatus = STAGE_STATUS.PENDING_TEAM_LEADER;
        }

        stageInstances[currentStageIndex] = {
          ...stageInstances[currentStageIndex],
          status: currentStatus,
          activatedAt: task.startDate || task.createdAt
        };
      }
    }

    return {
      ...task,
      stageInstances: stageInstances,
      overallStatus: task.isWorkflowComplete ? 'completed' : 'in_progress',
      parentTaskJourneyId: null,
      rootTaskJourneyId: null,
      childTaskJourneyIds: [],
      isChildTask: false,
      childSequence: null
    };
  },

  /**
   * Get current active stage instance
   */
  getCurrentStageInstance: (taskJourney) => {
    if (!taskJourney.stageInstances || taskJourney.stageInstances.length === 0) {
      return null;
    }

    return taskJourney.stageInstances.find(
      si => si.stageOrder === taskJourney.currentStage
    ) || null;
  },

  /**
   * Get next stage instance
   */
  getNextStageInstance: (taskJourney) => {
    if (!taskJourney.stageInstances || taskJourney.stageInstances.length === 0) {
      return null;
    }

    const nextStageOrder = taskJourney.currentStage + 1;
    return taskJourney.stageInstances.find(
      si => si.stageOrder === nextStageOrder
    ) || null;
  },

  /**
   * Check if task journey is at last stage
   */
  isAtLastStage: (taskJourney) => {
    if (!taskJourney.stageInstances || taskJourney.stageInstances.length === 0) {
      return true;
    }

    return taskJourney.currentStage >= taskJourney.stageInstances.length;
  },

  /**
   * Get overall progress percentage
   */
  getOverallProgress: (taskJourney) => {
    if (!taskJourney.stageInstances || taskJourney.stageInstances.length === 0) {
      return 0;
    }

    const completedStages = taskJourney.stageInstances.filter(
      si => si.status === STAGE_STATUS.COMPLETED
    ).length;

    return Math.round((completedStages / taskJourney.stageInstances.length) * 100);
  },

  /**
   * Get stage instance by order
   */
  getStageByOrder: (taskJourney, stageOrder) => {
    if (!taskJourney.stageInstances) {
      return null;
    }

    return taskJourney.stageInstances.find(si => si.stageOrder === stageOrder) || null;
  },

  /**
   * Update stage instance in task journey
   */
  updateStageInJourney: (taskJourney, stageOrder, updatedStage) => {
    if (!taskJourney.stageInstances) {
      return taskJourney;
    }

    const stageIndex = taskJourney.stageInstances.findIndex(
      si => si.stageOrder === stageOrder
    );

    if (stageIndex === -1) {
      return taskJourney;
    }

    const updatedStageInstances = [...taskJourney.stageInstances];
    updatedStageInstances[stageIndex] = updatedStage;

    return {
      ...taskJourney,
      stageInstances: updatedStageInstances,
      updatedAt: new Date().toISOString()
    };
  },

  /**
   * Create child task journey
   */
  createChildTaskJourney: (parentTaskJourney, sequence, totalChildren) => {
    const now = new Date().toISOString();
    const childId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const childStageInstances = parentTaskJourney.stageInstances.map((parentStage, index) => {
      const childStage = StageService.createStageInstance({
        stageOrder: parentStage.stageOrder,
        categoryId: parentStage.categoryId,
        categoryName: parentStage.categoryName,
        assignedDoerId: parentStage.assignedDoerId,
        assignedDoerName: parentStage.assignedDoerName,
        assignedCheckerId: parentStage.assignedCheckerId,
        assignedCheckerName: parentStage.assignedCheckerName,
        assignedTeamLeaderId: parentStage.assignedTeamLeaderId,
        assignedTeamLeaderName: parentStage.assignedTeamLeaderName,
        worksheetTemplateId: parentStage.worksheetTemplateId,
        status: index === 0 ? STAGE_STATUS.PENDING_DOER : STAGE_STATUS.WAITING,
        activatedAt: index === 0 ? now : null
      });

      return childStage;
    });

    return {
      ...parentTaskJourney,
      id: childId,
      title: `${parentTaskJourney.title} (${sequence}/${totalChildren})`,
      parentTaskJourneyId: parentTaskJourney.id,
      rootTaskJourneyId: parentTaskJourney.rootTaskJourneyId || parentTaskJourney.id,
      childTaskJourneyIds: [],
      isChildTask: true,
      childSequence: `${sequence}/${totalChildren}`,
      stageInstances: childStageInstances,
      overallStatus: 'in_progress',
      currentStage: 1,
      stageHistory: [],
      isWorkflowComplete: false,
      createdAt: now,
      updatedAt: now
    };
  }
};

export default TaskJourneyUtils;
