#!/bin/bash

# ConfigPanel.jsx replacements
sed -i '' 's/{t\.configTitle}/⚙️ Configuration/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.calcMethod}/Calculation Method/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.focusFactorMethod}/Focus Factor (Coefficient)/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.avgVelocityMethod}/Average Team Velocity/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.avgVelocityTooltip}/Calculation by average velocity is less accurate as it doesn'\''t account for individual capacity changes as precisely as the focus factor method./g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.teamVelocityLabel}/Team Velocity (SP \/ Day)/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.teamVelocityTooltip}/Total daily velocity of the entire team (Story Points per Day)./g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.allocationPct}/Allocation Percentages/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.bugs}/🐛 Bugs/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.committed}/✅ Committed Goals/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.uncommitted}/📋 Uncommitted Goals/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.future}/🔮 Future Goals/g' src/components/ConfigPanel.jsx
sed -i '' 's/{t\.techDebt}/🔧 Tech Debt/g' src/components/ConfigPanel.jsx
sed -i '' 's/function ConfigPanel({ config, setConfig, calculationMethod, setCalculationMethod, teamVelocity, setTeamVelocity, t })/function ConfigPanel({ config, setConfig, calculationMethod, setCalculationMethod, teamVelocity, setTeamVelocity })/g' src/components/ConfigPanel.jsx

# SprintManager.jsx replacements
sed -i '' 's/{t\.sprintScheduleTitle}/📅 Sprint Schedule/g' src/components/SprintManager.jsx
sed -i '' 's/{t\.sprintName}/Sprint Name/g' src/components/SprintManager.jsx
sed -i '' 's/{t\.startDate}/Start Date/g' src/components/SprintManager.jsx
sed -i '' 's/{t\.endDate}/End Date/g' src/components/SprintManager.jsx
sed -i '' 's/{t\.workingDays}/Working Days/g' src/components/SprintManager.jsx
sed -i '' 's/{t\.addSprint}/+ Add Sprint/g' src/components/SprintManager.jsx
sed -i '' 's/function SprintManager({ sprints, setSprints, t })/function SprintManager({ sprints, setSprints })/g' src/components/SprintManager.jsx

# TeamManager.jsx replacements
sed -i '' 's/{t\.teamMembersTitle}/👥 Team Members/g' src/components/TeamManager.jsx
sed -i '' 's/{t\.addMember}/+ Add Member/g' src/components/TeamManager.jsx
sed -i '' 's/{t\.focusFactor}/Focus Factor/g' src/components/TeamManager.jsx
sed -i '' 's/{t\.employeeName}/Employee name/g' src/components/TeamManager.jsx
sed -i '' 's/function TeamManager({ employees, setEmployees, calculationMethod, t })/function TeamManager({ employees, setEmployees, calculationMethod })/g' src/components/TeamManager.jsx

# FocusFactorCalculator.jsx replacements
sed -i '' 's/{t\.focusCalculatorTitle}/📈 Focus Factor Calculator/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/{t\.calcDescription}/Enter planned vs actual story points for the last 5 sprints to automatically calculate focus factor/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/{t\.sprint}/Sprint/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/{t\.planned}/Planned/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/{t\.actual}/Actual/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/{t\.total}/Total/g' src/components/FocusFactorCalculator.jsx
sed -i '' 's/function FocusFactorCalculator({ employees, setEmployees, t })/function FocusFactorCalculator({ employees, setEmployees })/g' src/components/FocusFactorCalculator.jsx

# VacationMatrix.jsx replacements
sed -i '' 's/{t\.vacationMatrixTitle}/🏖️ Vacation \& Availability/g' src/components/VacationMatrix.jsx
sed -i '' 's/{t\.teamMember}/Team Member/g' src/components/VacationMatrix.jsx
sed -i '' 's/{t\.total}/Total/g' src/components/VacationMatrix.jsx
sed -i '' 's/function VacationMatrix({ employees, sprints, vacations, setVacations, t })/function VacationMatrix({ employees, sprints, vacations, setVacations })/g' src/components/VacationMatrix.jsx

# CapacityDashboard.jsx replacements
sed -i '' 's/{t\.capacityDashboardTitle}/📊 Capacity Dashboard/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.dashboardDesc}/Team capacity breakdown by sprint and allocation category/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.grossCapacityTitle}/Team Member Breakdown - Gross Capacity/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.grossCapacityDesc}/Total capacity with vacation and focus factor applied/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.netCapacityTitle}/Team Member Breakdown - Net Capacity/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.sprintAllocation}/Sprint Allocation Breakdown/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.rounding}/Rounding Mode:/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.roundFloor}/Round Down (SAFe Recommended)/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.roundNearest}/Round to Nearest/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.roundCeil}/Round Up/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.roundNone}/No Rounding/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.teamMember}/Team Member/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.dailyShare}/Daily Share/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.total}/Total/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.totalCapacity}/Total Capacity/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.totalNetCapacity}/Total Net Capacity/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.bugs}/🐛 Bugs/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.committed}/✅ Committed/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.uncommitted}/📋 Uncommitted/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.future}/🔮 Future/g' src/components/CapacityDashboard.jsx
sed -i '' 's/{t\.techDebt}/🔧 Tech Debt/g' src/components/CapacityDashboard.jsx
sed -i '' 's/function CapacityDashboard({ employees, sprints, config, vacations, calculationMethod, teamVelocity, t })/function CapacityDashboard({ employees, sprints, config, vacations, calculationMethod, teamVelocity })/g' src/components/CapacityDashboard.jsx

echo "Replacements complete!"
