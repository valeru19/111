import { startTransition, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { getReadableErrorMessage } from '../api/errors'
import { authService } from '../api/services/authService'
import { tokenStorage } from '../api/services/tokenStorage'

const initialLoginForm = {
  username: '',
  password: '',
}

const initialRegisterForm = {
  username: '',
  password: '',
  full_name: '',
  phone: '',
  email: '',
}

const initialEmployeeFirstForm = {
  username: '',
  password: '',
  passwordConfirm: '',
}

const tunnelUnavailableMessage =
  'Публичный адрес недоступен. Перезапустите интернет-туннель и откройте новый URL.'

type AuthMode = 'login' | 'register' | 'employee_first'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [registerForm, setRegisterForm] = useState(initialRegisterForm)
  const [employeeFirstForm, setEmployeeFirstForm] = useState(initialEmployeeFirstForm)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = (location.state as { from?: string } | null)?.from || '/reports'

  async function handleLoginSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      const response = await authService.login(loginForm)
      tokenStorage.set(response.token)
      startTransition(() => {
        navigate(redirectTo, { replace: true })
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) {
        setError(tunnelUnavailableMessage)
        return
      }
      setError(getReadableErrorMessage(requestError, 'Не удалось войти.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRegisterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    try {
      await authService.register(registerForm)
      setMode('login')
      setMessage('Пользователь создан. Теперь можно выполнить вход.')
      setRegisterForm(initialRegisterForm)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) {
        setError(tunnelUnavailableMessage)
        return
      }
      setError(getReadableErrorMessage(requestError, 'Не удалось зарегистрироваться.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEmployeeFirstSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')
    setError('')

    if (employeeFirstForm.password !== employeeFirstForm.passwordConfirm) {
      setError('Пароли не совпадают.')
      setSubmitting(false)
      return
    }

    try {
      const response = await authService.activateEmployee({
        username: employeeFirstForm.username,
        password: employeeFirstForm.password,
      })
      tokenStorage.set(response.token)
      setEmployeeFirstForm(initialEmployeeFirstForm)
      startTransition(() => {
        navigate('/my-profile', { replace: true })
      })
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 404) {
        setError(tunnelUnavailableMessage)
        return
      }
      setError(getReadableErrorMessage(requestError, 'Не удалось задать пароль.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-panel auth-panel-highlight">
        <p className="eyebrow">Брадобрей пати</p>
        <h1>Система управления и мониторинг работы салонами, бронированиями, мастерами</h1>
        <p className="lede">
          Отчёты в четком виде и PDF формате. Токен сохраняется в
          <code> localStorage </code>
          и автоматически подставляется во все API-запросы после входа.
        </p>
        <div className="tip-list">
          <div className="tip-card">
            <strong>Вход</strong>
            <span>Для учётных записей с уже заданным паролем.</span>
          </div>
          <div className="tip-card">
            <strong>Регистрация</strong>
            <span>Создание клиентской учётной записи.</span>
          </div>
          <div className="tip-card">
            <strong>Первый вход сотрудника</strong>
            <span>Если администратор завёл вас без пароля — задайте пароль здесь, не через регистрацию.</span>
          </div>
        </div>
      </section>

      <section className="auth-panel auth-form-panel">
        <div className="auth-form-head-stack">
          <div
            className={`auth-form-pane ${mode === 'login' ? 'auth-form-pane-active' : ''}`}
            aria-hidden={mode !== 'login'}
          >
            <h2>Вход в систему</h2>
            <p>Логин и пароль, которые вы уже используете.</p>
          </div>
          <div
            className={`auth-form-pane ${mode === 'register' ? 'auth-form-pane-active' : ''}`}
            aria-hidden={mode !== 'register'}
          >
            <h2>Регистрация</h2>
            <p>Новая клиентская учётная запись.</p>
          </div>
          <div
            className={`auth-form-pane ${mode === 'employee_first' ? 'auth-form-pane-active' : ''}`}
            aria-hidden={mode !== 'employee_first'}
          >
            <h2>Первый вход сотрудника</h2>
            <p>Логин выдал администратор; пароль придумайте сами (не менее 6 символов).</p>
          </div>
        </div>

        <div
          className="tab-row tab-row-auth tab-row-auth--3"
          role="tablist"
          aria-label="Режим авторизации"
        >
          <span className="tab-row-slider" aria-hidden data-position={mode} />
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            id="auth-tab-login"
            className={mode === 'login' ? 'tab-button tab-button-active' : 'tab-button'}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            id="auth-tab-register"
            className={mode === 'register' ? 'tab-button tab-button-active' : 'tab-button'}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'employee_first'}
            id="auth-tab-employee"
            className={mode === 'employee_first' ? 'tab-button tab-button-active' : 'tab-button'}
            onClick={() => setMode('employee_first')}
          >
            Сотрудник
          </button>
        </div>

        {message ? <div className="alert alert-success">{message}</div> : null}
        {error ? <div className="alert alert-error">{error}</div> : null}

        <div className="auth-form-stack">
          <form
            className={`stack-form auth-form-pane ${mode === 'login' ? 'auth-form-pane-active' : ''}`}
            onSubmit={handleLoginSubmit}
            aria-labelledby="auth-tab-login"
            aria-hidden={mode !== 'login'}
            inert={mode !== 'login' ? true : undefined}
          >
            <label className="field">
              <span>Логин</span>
              <input
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="admin"
                required
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="password"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Выполняем вход...' : 'Войти'}
            </button>
          </form>

          <form
            className={`stack-form auth-form-pane ${mode === 'register' ? 'auth-form-pane-active' : ''}`}
            onSubmit={handleRegisterSubmit}
            aria-labelledby="auth-tab-register"
            aria-hidden={mode !== 'register'}
            inert={mode !== 'register' ? true : undefined}
          >
            <label className="field">
              <span>Логин</span>
              <input
                value={registerForm.username}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="client_ivan"
                required
              />
            </label>

            <label className="field">
              <span>Пароль</span>
              <input
                type="password"
                value={registerForm.password}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="password"
                required
              />
            </label>

            <label className="field">
              <span>ФИО</span>
              <input
                value={registerForm.full_name}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, full_name: event.target.value }))
                }
                placeholder="Иван Петров"
                required
              />
            </label>

            <label className="field">
              <span>Телефон</span>
              <input
                value={registerForm.phone}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="+79991234567"
                required
              />
            </label>

            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={registerForm.email}
                onChange={(event) =>
                  setRegisterForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="client@example.com"
                required
              />
            </label>

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Создаём пользователя...' : 'Зарегистрироваться'}
            </button>
          </form>

          <form
            className={`stack-form auth-form-pane ${mode === 'employee_first' ? 'auth-form-pane-active' : ''}`}
            onSubmit={handleEmployeeFirstSubmit}
            aria-labelledby="auth-tab-employee"
            aria-hidden={mode !== 'employee_first'}
            inert={mode !== 'employee_first' ? true : undefined}
          >
            <label className="field">
              <span>Логин (никнейм)</span>
              <input
                value={employeeFirstForm.username}
                onChange={(event) =>
                  setEmployeeFirstForm((current) => ({ ...current, username: event.target.value }))
                }
                placeholder="master_ivan"
                required
                minLength={3}
              />
            </label>
            <label className="field">
              <span>Новый пароль</span>
              <input
                type="password"
                value={employeeFirstForm.password}
                onChange={(event) =>
                  setEmployeeFirstForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="не менее 6 символов"
                required
                minLength={6}
              />
            </label>
            <label className="field">
              <span>Повтор пароля</span>
              <input
                type="password"
                value={employeeFirstForm.passwordConfirm}
                onChange={(event) =>
                  setEmployeeFirstForm((current) => ({ ...current, passwordConfirm: event.target.value }))
                }
                placeholder="повторите пароль"
                required
                minLength={6}
              />
            </label>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Сохраняем пароль...' : 'Задать пароль и войти'}
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
