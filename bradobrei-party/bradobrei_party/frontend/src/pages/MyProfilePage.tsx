import { useEffect, useState } from 'react'
import { getReadableErrorMessage } from '../api/errors'
import { employeeService } from '../api/services/employeeService'
import { ScheduleEditor } from '../components/ScheduleEditor'
import type { EmployeeManagementDto } from '../types/dto/employee'

export function MyProfilePage() {
  const [profile, setProfile] = useState<EmployeeManagementDto | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [workSchedule, setWorkSchedule] = useState('{}')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadProfile()
  }, [])

  async function loadProfile() {
    setLoading(true)
    setError('')
    try {
      const data = await employeeService.getMe()
      setProfile(data)
      setFullName(data.user?.full_name || '')
      setPhone(data.user?.phone || '')
      setEmail(data.user?.email || '')
      setSpecialization(data.specialization || '')
      setWorkSchedule(data.work_schedule || '{}')
    } catch (requestError) {
      setError(getReadableErrorMessage(requestError, 'Не удалось загрузить профиль.'))
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')
    try {
      const updated = await employeeService.patchMyProfile({
        full_name: fullName,
        phone,
        email: email.trim() || '',
        specialization,
        work_schedule: workSchedule,
      })
      setProfile(updated)
      setMessage('Изменения сохранены.')
    } catch (requestError) {
      setError(getReadableErrorMessage(requestError, 'Не удалось сохранить профиль.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <section className="page-section">
        <p className="section-description">Загрузка профиля…</p>
      </section>
    )
  }

  if (!profile) {
    return (
      <section className="page-section">
        <div className="alert alert-error">{error || 'Профиль недоступен.'}</div>
      </section>
    )
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h2>Мой профиль</h2>
          <p className="section-description">
            Логин и роль задаёт администратор. Здесь можно обновить контакты, специализацию и график.
          </p>
        </div>
      </div>

      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="card-form card-form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span>Логин</span>
          <input value={profile.user?.username || ''} readOnly disabled />
        </label>
        <label className="field">
          <span>Роль</span>
          <input value={profile.user?.role || ''} readOnly disabled />
        </label>
        <label className="field field-wide">
          <span>ФИО</span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+79990001122" />
        </label>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="необязательно"
          />
        </label>
        <label className="field field-wide">
          <span>Специализация</span>
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="Например: стрижка, борода"
          />
        </label>
        <ScheduleEditor
          label="График работы"
          value={workSchedule}
          onChange={setWorkSchedule}
          hint="Формат JSON по дням недели."
          placeholder="10:00-19:00"
        />
        <label className="field">
          <span>Оклад (только просмотр)</span>
          <input value={String(profile.expected_salary)} readOnly disabled />
        </label>
        <button type="submit" className="primary-button field-wide" disabled={submitting}>
          {submitting ? 'Сохраняем…' : 'Сохранить изменения'}
        </button>
      </form>
    </section>
  )
}
