import { pythonCourse } from '../lib/python-course.mjs';

export const projectSolution = 'def resumir_gastos(gastos, limite):\n    if limite < 0:\n        return None\n    total = 0\n    for gasto in gastos:\n        total += gasto["valor"]\n    return {"total": total, "saldo": limite - total, "dentro_limite": total <= limite}\n\ngastos = [{"valor": 30}, {"valor": 10}]\nresumo = resumir_gastos(gastos, 50)\nprint(resumo["total"])';

export const pythonSolutions = Object.fromEntries(pythonCourse.lessons.map(lesson => [lesson.id, lesson.id === 'py-1' ? lesson.code + '\nprint(len(linguagens))' : lesson.id === 'py-projeto-final' ? projectSolution : lesson.code]));
