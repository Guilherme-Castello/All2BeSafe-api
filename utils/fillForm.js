export function getAnswareById(answares, targetId){
    return answares.find(a => a.question_id == targetId)
}

export function answareForm(form, answare) {
    const questions = form.questions

    let aQuestions = questions.map(q => {
        let a = getAnswareById(answare.answares, q.id)

        if(q.kind == 'check_boxes'){
            return {...q.toObject(), check_boxes: a.answare_checkboxes}
        } else if (q.kind == 'location'){
            return {...q.toObject(), value: a.answare_text, coords: a.answare_coords}
        } else {
            return {...q.toObject(), value: a.answare_text}
        }
    })

    return {...form.toObject(), questions: aQuestions}
}