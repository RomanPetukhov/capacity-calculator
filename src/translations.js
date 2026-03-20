export const translations = {
    en: {
        appTitle: "Capacity Calculator",
        configTitle: "⚙️ Configuration",
        sprintScheduleTitle: "📅 Sprint Schedule",
        teamMembersTitle: "👥 Team Members",
        focusCalculatorTitle: "📈 Focus Factor Calculator",
        vacationMatrixTitle: "🏖️ Vacation Matrix",
        capacityDashboardTitle: "📊 Capacity Dashboard",

        // Config Panel
        calcMethod: "Calculation Method",
        focusFactorMethod: "Focus Factor (Coefficient)",
        avgVelocityMethod: "Average Team Velocity",
        avgVelocityTooltip: "Calculation by average velocity is less accurate as it doesn't account for individual capacity changes as precisely as the focus factor method.",
        teamVelocityLabel: "Team Velocity (SP / Day)",
        teamVelocityTooltip: "Total daily velocity of the entire team (Story Points per Day).",
        allocationPct: "Allocation Percentages",
        maintenance: "🛠️ Maintenance",
        committed: "✅ Committed Goals",
        spikes: "⚡ Spikes",
        techDebt: "🔧 Tech Debt",

        // Sprint Manager
        sprintName: "Sprint Name",
        startDate: "Start Date",
        endDate: "End Date",
        workingDays: "Working Days",
        addSprint: "+ Add Sprint",

        // Team Manager
        addMember: "+ Add Member",
        focusFactor: "Focus Factor",
        avgVelocity: "Avg Velocity",
        employeeName: "Employee name",

        // Focus Calculator
        calcDescription: "Enter planned vs actual story points for the last 5 sprints to automatically calculate focus factor",
        sprint: "Sprint",
        planned: "Planned",
        actual: "Actual",
        total: "Total",

        // Dashboard
        dashboardDesc: "Team capacity breakdown by sprint and allocation category",
        grossCapacityTitle: "Team Member Breakdown - Gross Capacity",
        grossCapacityDesc: "Total capacity with vacation and focus factor applied",
        netCapacityTitle: "Team Member Breakdown - Net Capacity",
        netCapacityDesc: "Capacity for Committed goals only (Maintenance, Spikes, and Tech Debt deducted)",
        sprintAllocation: "Sprint Allocation Breakdown",
        rounding: "Rounding Mode:",
        roundFloor: "Round Down (SAFe Recommended)",
        roundNearest: "Round to Nearest",
        roundCeil: "Round Up",
        roundNone: "No Rounding",
        teamMember: "Team Member",
        dailyShare: "Daily Share",
        totalCapacity: "Total Capacity",
        totalNetCapacity: "Total Net Capacity",

        // Save/Load
        save: "Save",
        load: "Load",
        loadSuccess: "Data loaded successfully!",
        loadError: "Error loading file. Please check the file format.",
    },
    ru: {
        appTitle: "Калькулятор Капаситета",
        configTitle: "⚙️ Конфигурация",
        sprintScheduleTitle: "📅 Расписание Спринтов",
        teamMembersTitle: "👥 Состав Команды",
        focusCalculatorTitle: "📈 Калькулятор Фокус-Фактора",
        vacationMatrixTitle: "🏖️ Матрица Отпусков",
        capacityDashboardTitle: "📊 Дашборд Капаситета",

        // Config Panel
        calcMethod: "Метод Расчета",
        focusFactorMethod: "Фокус-Фактор (Коэффициент)",
        avgVelocityMethod: "Средняя Скорость Команды",
        avgVelocityTooltip: "Расчет по средней скорости менее точен, так как не учитывает индивидуальные изменения доступности так же точно, как метод фокус-фактора.",
        teamVelocityLabel: "Скорость Команды (SP / День)",
        teamVelocityTooltip: "Общая дневная скорость всей команды (Story Points в день).",
        allocationPct: "Проценты Распределения",
        maintenance: "🛠️ Техобслуживание",
        committed: "✅ Обязательства",
        spikes: "⚡ Спайки",
        techDebt: "🔧 Тех. Долг",

        // Sprint Manager
        sprintName: "Название Спринта",
        startDate: "Дата Начала",
        endDate: "Дата Окончания",
        workingDays: "Раб. Дни",
        addSprint: "+ Добавить Спринт",

        // Team Manager
        addMember: "+ Добавить",
        focusFactor: "Фокус-Фактор",
        avgVelocity: "Ср. Скорость",
        employeeName: "Имя сотрудника",

        // Focus Calculator
        calcDescription: "Введите запланированные и фактические SP за последние 5 спринтов для автоматического расчета фокус-фактора",
        sprint: "Спринт",
        planned: "План",
        actual: "Факт",
        total: "Итого",

        // Dashboard
        dashboardDesc: "Разбивка капаситета команды по спринтам и категориям",
        grossCapacityTitle: "Разбивка по Участникам - Общий Капаситет",
        grossCapacityDesc: "Полный капаситет с учетом отпусков и фокус-фактора",
        netCapacityTitle: "Разбивка по Участникам - Чистый Капаситет",
        netCapacityDesc: "Капасити только на Committed цели (после вычета Maintenance, Spikes и Tech Debt)",
        sprintAllocation: "Разбивка Аллокации Спринта",
        rounding: "Округление:",
        roundFloor: "Вниз (рек. SAFe)",
        roundNearest: "До ближайшего",
        roundCeil: "Вверх",
        roundNone: "Без округления",
        teamMember: "Участник",
        dailyShare: "Дневная Доля",
        totalCapacity: "Всего Капаситет",
        totalNetCapacity: "Всего Чистый",

        // Save/Load
        save: "Сохранить",
        load: "Загрузить",
        loadSuccess: "Данные успешно загружены!",
        loadError: "Ошибка загрузки файла. Проверьте формат файла.",
    }
};
