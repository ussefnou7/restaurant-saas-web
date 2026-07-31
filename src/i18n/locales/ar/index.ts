import { mergeMessages } from '../../mergeMessages'
import { authAr } from './auth'
import { assetsAr } from './assets'
import { branchDetailsAr } from './branchDetails'
import { branchesAr } from './branches'
import { commonAr } from './common'
import { customersAr } from './customers'
import { devicesAr } from './devices'
import { employeesAr } from './employees'
import { errorsAr } from './errors'
import { hubsAr } from './hubs'
import { inventoryAr } from './inventory'
import { jobsAr } from './jobs'
import { layoutAr } from './layout'
import { menuAr } from './menu'
import { ordersAr } from './orders'
import { orderConsumptionAr } from './orderConsumption'
import { leavesAr } from './leaves'
import { leaveAssignAr } from './leaveAssign'
import { leaveRequestsAr } from './leaveRequests'
import { leaveTypesAr } from './leaveTypes'
import { payrollAr } from './payroll'
import { permissionsAr } from './permissions'
import { reportsAr } from './reports'
import { tablesAr } from './tables'
import { userDetailsAr } from './userDetails'
import { usersAr } from './users'

export const ar = mergeMessages(
  commonAr,
  customersAr,
  assetsAr,
  devicesAr,
  layoutAr,
  authAr,
  jobsAr,
  branchesAr,
  branchDetailsAr,
  employeesAr,
  usersAr,
  userDetailsAr,
  permissionsAr,
  leaveRequestsAr,
  payrollAr,
  leavesAr,
  leaveAssignAr,
  leaveTypesAr,
  hubsAr,
  inventoryAr,
  menuAr,
  ordersAr,
  orderConsumptionAr,
  tablesAr,
  reportsAr,
  errorsAr,
)
