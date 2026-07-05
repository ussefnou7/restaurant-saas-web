import { mergeMessages } from '../../mergeMessages'
import { authEn } from './auth'
import { branchDetailsEn } from './branchDetails'
import { branchesEn } from './branches'
import { commonEn } from './common'
import { employeesEn } from './employees'
import { errorsEn } from './errors'
import { hubsEn } from './hubs'
import { inventoryEn } from './inventory'
import { jobsEn } from './jobs'
import { layoutEn } from './layout'
import { menuEn } from './menu'
import { leavesEn } from './leaves'
import { leaveAssignEn } from './leaveAssign'
import { leaveRequestsEn } from './leaveRequests'
import { leaveTypesEn } from './leaveTypes'
import { payrollEn } from './payroll'
import { permissionsEn } from './permissions'
import { userDetailsEn } from './userDetails'
import { usersEn } from './users'

export const en = mergeMessages(
  commonEn,
  layoutEn,
  authEn,
  jobsEn,
  branchesEn,
  branchDetailsEn,
  employeesEn,
  usersEn,
  userDetailsEn,
  permissionsEn,
  leaveRequestsEn,
  payrollEn,
  leavesEn,
  leaveAssignEn,
  leaveTypesEn,
  hubsEn,
  inventoryEn,
  menuEn,
  errorsEn,
)
