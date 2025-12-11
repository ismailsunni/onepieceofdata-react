import { useQuery } from '@tanstack/react-query'
import { fetchCharacterBirthdays, BirthdaysByDate } from '../services/analyticsService'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSkull } from '@fortawesome/free-solid-svg-icons'

interface CalendarDay {
  date: number
  month: number
  year: number
  dateKey: string
  isCurrentMonth: boolean
  birthdayCount: number
  characters: { id: string; name: string; birth_date: string; age: number | null; status: string | null }[]
}

function CharacterBirthdayPage() {
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [hoveredDay, setHoveredDay] = useState<CalendarDay | null>(null)

  const { data: birthdaysData, isLoading, error } = useQuery<BirthdaysByDate>({
    queryKey: ['analytics', 'character-birthdays'],
    queryFn: fetchCharacterBirthdays,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get intensity color based on birthday count
  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100'
    if (count === 1) return 'bg-blue-200'
    if (count === 2) return 'bg-blue-400'
    if (count === 3) return 'bg-blue-600'
    return 'bg-blue-800'
  }

  // Get text color for date number based on background intensity
  const getDateTextColor = (count: number): string => {
    if (count >= 3) return 'text-white' // Dark backgrounds need white text
    return 'text-gray-800' // Light backgrounds use dark text
  }

  // Generate calendar days for a specific month
  const generateCalendarDays = (year: number, month: number): CalendarDay[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []

    // Add previous month's days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = prevMonthLastDay - i
      const dateKey = `${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      days.push({
        date,
        month: month - 1,
        year: month === 0 ? year - 1 : year,
        dateKey,
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    // Add current month's days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateKey = `${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      const characters = birthdaysData?.[dateKey] || []
      days.push({
        date,
        month,
        year,
        dateKey,
        isCurrentMonth: true,
        birthdayCount: characters.length,
        characters,
      })
    }

    // Add next month's days to complete the grid
    const remainingDays = 42 - days.length // 6 rows * 7 days
    for (let date = 1; date <= remainingDays; date++) {
      const dateKey = `${String(month + 2).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      days.push({
        date,
        month: month + 1,
        year: month === 11 ? year + 1 : year,
        dateKey,
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    return days
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const goToToday = () => {
    const now = new Date()
    setSelectedYear(now.getFullYear())
    setSelectedMonth(now.getMonth())
    setViewMode('month')
  }

  const calendarDays = generateCalendarDays(selectedYear, selectedMonth)

  // Generate mini calendar for year view
  const generateMiniMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: CalendarDay[] = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: 0,
        month,
        year,
        dateKey: '',
        isCurrentMonth: false,
        birthdayCount: 0,
        characters: [],
      })
    }

    // Add actual days
    for (let date = 1; date <= daysInMonth; date++) {
      const dateKey = `${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`
      const characters = birthdaysData?.[dateKey] || []
      days.push({
        date,
        month,
        year,
        dateKey,
        isCurrentMonth: true,
        birthdayCount: characters.length,
        characters,
      })
    }

    return days
  }

  // Calculate statistics
  const totalBirthdays = birthdaysData
    ? Object.values(birthdaysData).reduce((sum, chars) => sum + chars.length, 0)
    : 0

  const datesWithBirthdays = birthdaysData ? Object.keys(birthdaysData).length : 0

  const maxBirthdaysOnOneDay = birthdaysData
    ? Math.max(...Object.values(birthdaysData).map((chars) => chars.length), 0)
    : 0

  // Find the busiest day(s)
  const busiestDays = birthdaysData
    ? Object.entries(birthdaysData)
        .filter(([_, chars]) => chars.length === maxBirthdaysOnOneDay)
        .map(([date, chars]) => ({ date, characters: chars }))
    : []

  // Calculate dates without birthdays
  const getDatesWithoutBirthdays = () => {
    if (!birthdaysData) return []

    const allDates: string[] = []
    // Generate all possible dates (MM-DD format)
    for (let month = 1; month <= 12; month++) {
      const daysInMonth = new Date(2024, month, 0).getDate() // Using 2024 (leap year) to get all possible days
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        allDates.push(dateKey)
      }
    }

    // Filter dates that don't have birthdays
    return allDates.filter(date => !birthdaysData[date])
  }

  const datesWithoutBirthdays = getDatesWithoutBirthdays()

  // Format date for display (MM-DD to "Month Day")
  const formatDate = (dateKey: string): string => {
    const [month, day] = dateKey.split('-')
    const monthIndex = parseInt(month) - 1
    return `${monthNames[monthIndex]} ${parseInt(day)}`
  }

  // Calculate distribution of dates by birthday count
  const getDateCountByBirthdays = () => {
    if (!birthdaysData) return { 0: 366, 1: 0, 2: 0, 3: 0, '4+': 0 }

    const counts = { 0: 0, 1: 0, 2: 0, 3: 0, '4+': 0 }

    // Count dates with birthdays
    Object.values(birthdaysData).forEach((chars) => {
      const count = chars.length
      if (count === 1) counts[1]++
      else if (count === 2) counts[2]++
      else if (count === 3) counts[3]++
      else if (count >= 4) counts['4+']++
    })

    // Dates without birthdays
    counts[0] = datesWithoutBirthdays.length

    return counts
  }

  const dateCountsByBirthdays = getDateCountByBirthdays()

  // Get today's date in MM-DD format
  const getTodayKey = (): string => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }

  const todayKey = getTodayKey()
  const todaysBirthdays = birthdaysData?.[todayKey] || []

  // Check if a date is today
  const isToday = (year: number, month: number, date: number): boolean => {
    const today = new Date()
    return (
      year === today.getFullYear() &&
      month === today.getMonth() &&
      date === today.getDate()
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600"></div>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-red-600">
            <p>Error loading birthday data. Please try again later.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="relative mb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-pink-50 opacity-60 rounded-2xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-rose-600">
                  Character Birthday Calendar
                </h1>
                <p className="text-gray-600 text-lg mt-2">
                  Explore when One Piece characters were born throughout the year
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Birthdays */}
        {todaysBirthdays.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-2 border-orange-300 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎂</span>
              </div>
              <h2 className="text-xl font-bold text-orange-700">
                Happy Birthday Today! 🎉
              </h2>
            </div>
          <div className="flex flex-wrap gap-2">
            {todaysBirthdays.map((char) => {
              const isDeceased = char.status === 'Deceased'
              const hasAge = char.age !== null && char.age !== undefined

              return (
                <Link
                  key={char.id}
                  to={`/characters/${char.id}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 px-3 py-1.5 bg-white rounded-full hover:bg-orange-50 hover:ring-2 hover:ring-orange-400 transition-all cursor-pointer shadow-sm"
                >
                  <span>🎈</span>
                  <span>
                    {char.name}
                    {!isDeceased && hasAge && (
                      <span className="text-xs text-gray-500 ml-1">({char.age})</span>
                    )}
                    {isDeceased && (
                      <FontAwesomeIcon icon={faSkull} className="text-gray-600 ml-1.5" />
                    )}
                  </span>
                </Link>
              )
            })}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Characters</h3>
            <p className="text-4xl font-bold text-pink-600">{totalBirthdays}</p>
            <p className="text-sm text-gray-500 mt-1">with known birthdays</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Unique Dates</h3>
            <p className="text-4xl font-bold text-rose-600">{datesWithBirthdays}</p>
            <p className="text-sm text-gray-500 mt-1">days with birthdays</p>
            {datesWithoutBirthdays.length > 0 && (
              <details className="mt-3 cursor-pointer">
                <summary className="text-xs font-medium text-gray-600 hover:text-rose-700 cursor-pointer select-none">
                  {datesWithoutBirthdays.length} dates without birthdays
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto bg-gray-50 rounded p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {datesWithoutBirthdays.map((date) => (
                      <div
                        key={date}
                        className="text-xs text-gray-600 px-1 py-0.5"
                      >
                        {formatDate(date)}
                      </div>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Busiest Day</h3>
            <p className="text-4xl font-bold text-purple-600">{maxBirthdaysOnOneDay}</p>
            <p className="text-sm text-gray-500 mt-1">characters in one day</p>
          {busiestDays.length > 0 && (
            <details className="mt-3 cursor-pointer">
              <summary className="text-xs font-medium text-gray-600 hover:text-purple-700 cursor-pointer select-none">
                {busiestDays.length > 1 ? `${busiestDays.length} dates` : formatDate(busiestDays[0].date)}
              </summary>
              <div className="mt-2 max-h-48 overflow-y-auto space-y-2">
                {busiestDays.map(({ date, characters }) => (
                  <div key={date} className="bg-purple-50 rounded p-2">
                    {busiestDays.length > 1 && (
                      <div className="text-xs font-bold text-purple-700 mb-1">
                        {formatDate(date)}
                      </div>
                    )}
                    <div className="space-y-1">
                      {characters.map((char) => {
                        const hasAge = char.age !== null && char.age !== undefined
                        const isDeceased = char.status === 'Deceased'
                        return (
                          <Link
                            key={char.id}
                            to={`/characters/${char.id}`}
                            className="flex items-center gap-1.5 text-xs text-gray-700 px-2 py-1 bg-white rounded hover:bg-purple-100 hover:ring-1 hover:ring-purple-500 transition-all cursor-pointer"
                          >
                            <span>
                              {char.name}
                              {hasAge && (
                                <span className="text-gray-500 ml-1">({char.age})</span>
                              )}
                              {isDeceased && (
                                <FontAwesomeIcon icon={faSkull} className="text-gray-500 text-[10px] ml-1" />
                              )}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

        {/* View Toggle and Navigation */}
        <div className="mb-8 flex flex-col gap-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex rounded-full bg-gradient-to-r from-pink-600 to-rose-600 p-1 shadow-md">
              <button
                onClick={() => setViewMode('month')}
                className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-pink-600 shadow-md'
                    : 'bg-transparent text-white hover:text-pink-100'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-6 py-2 rounded-full font-medium transition-all cursor-pointer ${
                  viewMode === 'year'
                    ? 'bg-white text-pink-600 shadow-md'
                    : 'bg-transparent text-white hover:text-pink-100'
                }`}
              >
                Year View
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:from-emerald-700 hover:to-teal-700 transition-all font-medium cursor-pointer shadow-md"
            >
              Today
            </button>
          </div>

          {/* Navigation */}
          {viewMode === 'month' ? (
            <div className="flex items-center justify-between">
              <button
                onClick={goToPreviousMonth}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all cursor-pointer shadow-md"
              >
                ← Previous
              </button>
              <h2 className="text-2xl font-bold text-gray-800">
                {monthNames[selectedMonth]} {selectedYear}
              </h2>
              <button
                onClick={goToNextMonth}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all cursor-pointer shadow-md"
              >
                Next →
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedYear(selectedYear - 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all cursor-pointer shadow-md"
              >
                ← {selectedYear - 1}
              </button>
              <h2 className="text-2xl font-bold text-gray-800">{selectedYear}</h2>
              <button
                onClick={() => setSelectedYear(selectedYear + 1)}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition-all cursor-pointer shadow-md"
              >
                {selectedYear + 1} →
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Birthday Count Legend:</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">No birthdays ({dateCountsByBirthdays[0]})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-200 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">1 character ({dateCountsByBirthdays[1]})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-400 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">2 characters ({dateCountsByBirthdays[2]})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">3 characters ({dateCountsByBirthdays[3]})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-800 border border-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">4+ characters ({dateCountsByBirthdays['4+']})</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'month' ? (
        /* Month View */
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              const isTodayDate = isToday(day.year, day.month, day.date)
              return (
                <div
                  key={index}
                  className={`
                    rounded-lg p-2 transition-all min-h-24
                    ${isTodayDate ? 'border-4 border-orange-500 shadow-lg ring-2 ring-orange-300' : 'border-2'}
                    ${!isTodayDate && day.isCurrentMonth ? 'border-gray-300' : ''}
                    ${!isTodayDate && !day.isCurrentMonth ? 'border-gray-200' : ''}
                    ${day.isCurrentMonth ? getIntensityColor(day.birthdayCount) : 'bg-gray-50'}
                  `}
                >
                <div
                  className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth
                      ? getDateTextColor(day.birthdayCount)
                      : 'text-gray-400'
                  }`}
                >
                  {day.date}
                </div>
                {day.birthdayCount > 0 && day.isCurrentMonth && (
                  <div className="space-y-1">
                    {day.characters.map((char, idx) => {
                      const hasAge = char.age !== null && char.age !== undefined
                      const isDeceased = char.status === 'Deceased'
                      return (
                        <Link
                          key={idx}
                          to={`/characters/${char.id}`}
                          className="flex items-center gap-1 text-xs text-gray-700 px-1 py-0.5 bg-white bg-opacity-80 rounded hover:bg-opacity-100 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer"
                          title={hasAge ? `${char.name} (${char.age})` : char.name}
                        >
                          <span className="truncate">
                            {char.name}
                            {hasAge && (
                              <span className="text-gray-500 ml-0.5">({char.age})</span>
                            )}
                            {isDeceased && (
                              <FontAwesomeIcon icon={faSkull} className="text-gray-500 text-[10px] ml-0.5" />
                            )}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Year View */
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {monthNames.map((monthName, monthIndex) => {
              const miniDays = generateMiniMonth(selectedYear, monthIndex)
              return (
                <div
                  key={monthIndex}
                  className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow relative"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedMonth(monthIndex)
                      setViewMode('month')
                    }}
                  >
                    <h3 className="text-center font-bold text-gray-800 mb-2 text-sm">
                      {monthName}
                    </h3>
                    {/* Mini day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <div key={idx} className="text-center text-xs text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Mini calendar days */}
                    <div className="grid grid-cols-7 gap-1">
                      {miniDays.map((day, dayIndex) => {
                        const isTodayDate = day.date > 0 && isToday(day.year, day.month, day.date)
                        const isHovered = hoveredDay?.month === monthIndex && hoveredDay?.date === day.date && day.birthdayCount > 0
                        return (
                          <div
                            key={dayIndex}
                            className="relative"
                            onMouseLeave={(e) => {
                              e.stopPropagation()
                              setHoveredDay(null)
                            }}
                          >
                            <div
                              className={`
                                aspect-square flex items-center justify-center text-xs rounded
                                ${isTodayDate ? 'ring-2 ring-orange-500 border-2 border-orange-500 font-bold' : ''}
                                ${day.date === 0 ? '' : getIntensityColor(day.birthdayCount)}
                                ${day.date === 0 ? 'text-transparent' : getDateTextColor(day.birthdayCount)}
                              `}
                              onMouseEnter={(e) => {
                                e.stopPropagation()
                                if (day.birthdayCount > 0) setHoveredDay(day)
                              }}
                            >
                              {day.date || ''}
                            </div>

                            {/* Popup tooltip for this specific date */}
                            {isHovered && (
                              <div
                                className="absolute left-full top-0 ml-2 bg-white border-2 border-blue-600 rounded-lg shadow-2xl p-3 z-50 min-w-[200px]"
                              >
                                <h4 className="text-sm font-bold text-gray-800 mb-2 whitespace-nowrap">
                                  {monthNames[day.month]} {day.date}
                                </h4>
                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                  {day.characters.map((char) => {
                                    const hasAge = char.age !== null && char.age !== undefined
                                    const isDeceased = char.status === 'Deceased'
                                    return (
                                      <Link
                                        key={char.id}
                                        to={`/characters/${char.id}`}
                                        className="flex items-center gap-1 text-xs text-gray-700 px-2 py-1.5 bg-blue-50 rounded hover:bg-blue-100 hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer whitespace-nowrap"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <span className="truncate">
                                          {char.name}
                                          {hasAge && (
                                            <span className="text-gray-500 ml-1">({char.age})</span>
                                          )}
                                          {isDeceased && (
                                            <FontAwesomeIcon icon={faSkull} className="text-gray-500 text-[10px] ml-1" />
                                          )}
                                        </span>
                                      </Link>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            {viewMode === 'month'
              ? 'Character names are shown directly in each date. Use the toggle to switch to Year View for an overview.'
              : 'Hover over colored dates to see character names. Click any month to view its full calendar with all details.'}
          </p>
        </div>
      </div>
    </main>
  )
}

export default CharacterBirthdayPage
