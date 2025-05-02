import Link from 'next/link';

export default function HomePage() {
  return (
    // Используем контейнер и центрирование для основного контента
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-12'>
      <div className='max-w-md w-full text-center'>
        {/* Логотип или иконка (опционально) */}
        {/* <svg ... > */}

        <h1 className='mt-6 text-4xl font-extrabold text-gray-900'>Handlebars Template Manager</h1>
        <p className='mt-3 text-lg text-gray-600'>
          Добро пожаловать! Управляйте вашими проектами и Handlebars шаблонами с предпросмотром.
        </p>

        {/* Кнопка-ссылка для перехода к проектам */}
        <div className='mt-8'>
          <Link
            href='/projects' // Ссылка на страницу со списком проектов
            className='inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out'
          >
            Перейти к проектам
            <svg
              className='ml-2 -mr-1 h-5 w-5'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
              fill='currentColor'
              aria-hidden='true'
            >
              <path
                fillRule='evenodd'
                d='M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </Link>
        </div>

        {/* Можно добавить дополнительную информацию или ссылки */}
        {/* <div className="mt-6 text-sm text-gray-500">
          <p>Начните с создания нового проекта или выберите существующий.</p>
        </div> */}
      </div>
    </div>
  );
}
