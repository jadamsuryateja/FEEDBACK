document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const yearSelect = document.getElementById('year');
    const semesterSelect = document.getElementById('semester');
    const branchSelect = document.getElementById('branch');
    const sectionSelect = document.getElementById('section');
    const fetchButton = document.getElementById('fetchButton');
    const feedbackResults = document.getElementById('feedbackResults');
    const filterSection = document.querySelector('.filter-section');

    // Create and configure academic year input
    const academicYearInput = document.createElement('input');
    academicYearInput.type = 'text';
    academicYearInput.id = 'academicYear';
    academicYearInput.placeholder = 'Academic Year (YYYY-YYYY)';
    academicYearInput.pattern = '^\d{4}-\d{4}$';
    academicYearInput.required = true;
    academicYearInput.style.cssText = 'padding: 10px; border: 1px solid #ddd; border-radius: 30px;';

    // Insert academic year input at the start
    filterSection.insertBefore(academicYearInput, filterSection.firstChild);

    // Add print styles dynamically
    const printStyles = `
        @media print {
            .comments-section {
                page-break-before: auto;
            }
            td {
                font-size: 12px;
                font-weight: bold;
            }
            .filter-section, .fetchButton, .fetchCommentsButton {
                display: none;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
            }
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);

    // Event listeners
    fetchButton.addEventListener('click', () => {
        fetchFeedbackSummary();
        clearComments(); // Clear comments when fetching new data
    });

    document.getElementById('fetchCommentsButton').addEventListener('click', () => {
        fetchComments();
        clearFeedbackResults(); // Clear feedback results when fetching comments
    });

    // Clear functions
    function clearComments() {
        document.getElementById('commentsTableContainer').innerHTML = '';
    }

    function clearFeedbackResults() {
        feedbackResults.innerHTML = '';
    }

    // Fetch feedback summary data
    async function fetchFeedbackSummary() {
        if (!validateInputs()) return;

        try {
            const response = await fetch(`http://192.168.95.97:3000/detailed-feedback-summary?` +
                `academicYear=${academicYearInput.value}&` +
                `year=${yearSelect.value}&` +
                `semester=${semesterSelect.value}&` +
                `branch=${branchSelect.value}&` +
                `section=${sectionSelect.value}`
            );

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();
            renderDetailedFeedbackSummary(data);
        } catch (error) {
            console.error('Error fetching feedback:', error);
            feedbackResults.innerHTML = `<p>Error fetching feedback: ${error.message}</p>`;
        }
    }

    // Fetch comments data
    async function fetchComments() {
        if (!validateInputs()) return;

        try {
            const response = await fetch(`http://192.168.95.97:3000/feedback-comments?` +
                `academicYear=${academicYearInput.value}&` +
                `year=${yearSelect.value}&` +
                `semester=${semesterSelect.value}&` +
                `branch=${branchSelect.value}&` +
                `section=${sectionSelect.value}`
            );

            if (!response.ok) throw new Error('Network response was not ok');

            const comments = await response.json();
            renderComments(comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            document.getElementById('commentsTableContainer').innerHTML =
                `<p>Error fetching comments: ${error.message}</p>`;
        }
    }

    // Calculate percentage for each question
    function calculateQuestionPercentage(questionData) {
        const ratingCounts = [
            questionData.rating_6_count || 0,
            questionData.rating_7_count || 0,
            questionData.rating_8_count || 0,
            questionData.rating_9_count || 0,
            questionData.rating_10_count || 0
        ];

        const totalRatings = ratingCounts.reduce((sum, count) => sum + count, 0);
        const weightedSum = ratingCounts.reduce((sum, count, index) =>
            sum + count * (index + 6), 0);

        return totalRatings > 0 ? (weightedSum / (totalRatings * 10)) * 100 : 0;
    }

    // Calculate score for each question
    function calculateQuestionScore(questionData) {
        const ratingCounts = [
            questionData.rating_6_count || 0,
            questionData.rating_7_count || 0,
            questionData.rating_8_count || 0,
            questionData.rating_9_count || 0,
            questionData.rating_10_count || 0
        ];

        return ratingCounts.reduce((sum, count, index) =>
            sum + count * (index + 6), 0);
    }

    // Calculate total percentage across all questions
    function calculateTotalPercentage(questionData) {
        let totalWeightedSum = 0;
        let totalResponses = 0;

        Object.values(questionData).forEach(qData => {
            const ratingCounts = [
                qData.rating_6_count || 0,
                qData.rating_7_count || 0,
                qData.rating_8_count || 0,
                qData.rating_9_count || 0,
                qData.rating_10_count || 0
            ];

            const responses = ratingCounts.reduce((sum, count) => sum + count, 0);
            const weightedSum = ratingCounts.reduce((sum, count, index) =>
                sum + count * (index + 6), 0);

            totalWeightedSum += weightedSum;
            totalResponses += responses;
        });

        return totalResponses > 0 ?
            (totalWeightedSum / (totalResponses * 10)) * 100 : 0;
    }

    // Render comments table
    function renderComments(comments) {
        const commentsContainer = document.getElementById('commentsTableContainer');

        if (!comments || comments.length === 0) {
            commentsContainer.innerHTML = '<p>No comments found.</p>';
            return;
        }

        const firstEntry = comments[0];
        const feedbackDate = firstEntry.date
            ? new Date(firstEntry.date)
            : new Date();

        const formattedDate = feedbackDate.getDate().toString().padStart(2, '0') + '-' +
            (feedbackDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
            feedbackDate.getFullYear();

        const formattedTime = feedbackDate.getHours().toString().padStart(2, '0') + ':' +
            feedbackDate.getMinutes().toString().padStart(2, '0') + ':' +
            feedbackDate.getSeconds().toString().padStart(2, '0');

        // Get total number of responses
        const totalResponses = firstEntry.total_responses || comments.length;

        let htmlContent = `
            <div class="comments-section">
                <h4>Feedback Comments</h4>
                <table>
                    <thead>
                        <tr>
                            <th colspan="3">
                                Academic Year: ${academicYearInput.value} | 
                                Year: ${yearSelect.value} | 
                                Semester: ${semesterSelect.value} | 
                                Branch: ${branchSelect.value} | 
                                Section: ${sectionSelect.value} | 
                                Date: ${formattedDate} | Time: ${formattedTime} |
                                Total Responses: ${totalResponses}
                            </th>
                        </tr>
                        <tr>
                            <th>S.No</th>
                            <th>College Comments</th>
                            <th>Department Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${comments.map((comment, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${comment.college_comments || 'No comments'}</td>
                                <td>${comment.department_comments || 'No comments'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        commentsContainer.innerHTML = htmlContent;
    }

    // Render feedback summary tables
    function renderDetailedFeedbackSummary(data) {
        if (!data || data.length === 0) {
            feedbackResults.innerHTML = '<p>No feedback data found.</p>';
            return;
        }

        const groupedData = {};
        data.forEach(item => {
            const key = `${item.teacher}_${item.subject}`;
            if (!groupedData[key]) {
                groupedData[key] = {};
            }
            groupedData[key][item.question_id] = item;
        });

        let htmlContent = '';

        Object.entries(groupedData).forEach(([key, questionData]) => {
            const [teacher, subject] = key.split('_');
            const firstEntry = Object.values(questionData)[0];

            const feedbackDate = firstEntry.date
                ? new Date(firstEntry.date)
                : new Date();

            // Format date as dd-mm-yyyy and time as hh:mm:ss
            const formattedDate = feedbackDate.getDate().toString().padStart(2, '0') + '-' +
                (feedbackDate.getMonth() + 1).toString().padStart(2, '0') + '-' +
                feedbackDate.getFullYear();

            const formattedTime = feedbackDate.getHours().toString().padStart(2, '0') + ':' +
                feedbackDate.getMinutes().toString().padStart(2, '0') + ':' +
                feedbackDate.getSeconds().toString().padStart(2, '0');

            const questionCalculations = Object.entries(questionData).map(([qId, qData]) => ({
                qId,
                percentage: calculateQuestionPercentage(qData),
                score: calculateQuestionScore(qData)
            }));

            const percentageSum = questionCalculations.reduce((sum, calc) =>
                sum + calc.percentage, 0);
            const scoreSum = questionCalculations.reduce((sum, calc) =>
                sum + calc.score, 0);
            const totalAvgPercentage = calculateTotalPercentage(questionData);

            htmlContent += `
                <div class="feedback-table-container">
                    <table class="feedback-table">
                        <thead>
                            <tr>
                                <th colspan="2">
                                    Academic Year: ${academicYearInput.value} | 
                                    Year: ${yearSelect.value} | 
                                    Semester: ${semesterSelect.value} | 
                                    Branch: ${branchSelect.value} | 
                                    Section: ${sectionSelect.value} | 
                                    Teacher: ${teacher} | 
                                    Subject: ${subject} |
                                    Date: ${formattedDate} | Time: ${formattedTime}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Responses</strong></td>
                                <td>${Object.values(questionData)[0].total_responses || 0}</td>
                            </tr>
                            <tr>
                                <td><strong>Totals</strong></td>
                                <td>
                                    ${questionCalculations.map(calc =>
                `Q${calc.qId}: ${calc.score.toFixed(2)}`).join(' | ')} | 
                                    <strong>Total: ${scoreSum.toFixed(2)}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Percentage</strong></td>
                                <td>
                                    ${questionCalculations.map(calc =>
                `Q${calc.qId}: ${calc.percentage.toFixed(2)}%`).join(' | ')} | 
                                    <strong>Total: ${(percentageSum / questionCalculations.length).toFixed(2)}%</strong>
                                </td>
                            </tr>
                            <tr>
                                <td><strong>Feedback(%)</strong></td>
                                <td><strong>${totalAvgPercentage.toFixed(2)}%</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        });

        feedbackResults.innerHTML = htmlContent;
    }

    // Input validation
    function validateInputs() {
        if (!academicYearInput.value || !yearSelect.value ||
            !semesterSelect.value || !branchSelect.value ||
            !sectionSelect.value) {
            alert('Please select all filter options and enter academic year');
            return false;
        }
        return true;
    }
});