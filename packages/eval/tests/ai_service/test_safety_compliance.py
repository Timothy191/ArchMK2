"""Safety compliance AI service evaluation."""

import pytest
from deepeval import assert_test
from deepeval.metrics import FactualConsistencyMetric, UnBiasedMetric
from deepeval.test_case import LLMTestCase

from datasets.golden_cases import SAFETY_COMPLIANCE_INPUTS
from helpers import call_ai_service


@pytest.mark.ai_service
@pytest.mark.asyncio
class TestSafetyCompliance:
    """Evaluate the safety compliance AI prompt."""

    @pytest.mark.parametrize("case", SAFETY_COMPLIANCE_INPUTS)
    async def test_factual_consistency(self, case, portal_base_url, use_cache):
        """AI safety analysis should be factually grounded in the provided logs."""
        actual_output = await call_ai_service("safetyCompliance", case["input"], use_cache=use_cache)
        test_case = LLMTestCase(
            input=case["input"],
            actual_output=actual_output,
            context=case["context"],
        )
        factual = FactualConsistencyMetric(minimum_score=0.8)
        assert_test(test_case, [factual])

    @pytest.mark.parametrize("case", SAFETY_COMPLIANCE_INPUTS)
    async def test_no_bias(self, case, portal_base_url, use_cache):
        """AI safety assessment should be unbiased and objective."""
        actual_output = await call_ai_service("safetyCompliance", case["input"], use_cache=use_cache)
        test_case = LLMTestCase(
            input=case["input"],
            actual_output=actual_output,
        )
        bias = UnBiasedMetric(minimum_score=0.9)
        assert_test(test_case, [bias])